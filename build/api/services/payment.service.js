"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_util_1 = __importDefault(require("../../utils/common.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const payment_util_1 = __importDefault(require("../../utils/payment.util"));
const case_repository_1 = require("../repository/case/case.repository");
const payment_repository_1 = require("../repository/payment/payment.repository");
const axios_1 = __importDefault(require("axios"));
class PaymentService {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getHomePayments(req) {
        let days = !Number(req.query.days) ? 3 : Number(req.query.days);
        let currentDate = common_util_1.default.getCurrentDate();
        let arrayName = String(req.query.arrayName);
        const payments = await this.getAllPayments(currentDate, days);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments);
        let page = 1;
        let limit = 10;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        let counts = {
            failedPayments: paymentsObj.failedPayments.length,
            successPayments: paymentsObj.successPayments.length,
            failedAuthorizations: paymentsObj.failedAuthorizations.length,
            successAuthorizations: paymentsObj.successAuthorizations.length,
            upcomingPayments: paymentsObj.upcomingPayments.length,
        };
        if (arrayName === 'default') {
            for (const key in paymentsObj) {
                if (Array.isArray(paymentsObj[key])) {
                    paymentsObj[key] = paymentsObj[key].slice((page - 1) * limit, page * limit);
                }
            }
        }
        else {
            if (paymentsObj[arrayName]) {
                paymentsObj[arrayName] = paymentsObj[arrayName].slice((page - 1) * limit, page * limit);
            }
        }
        return [
            true,
            {
                payments: paymentsObj,
                counts: counts,
            },
        ];
    }
    async getAllPayments(currentDate, days) {
        const startDate = new Date(new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000).toUTCString();
        return await this.paymentRepository.getAllWithoutPagination({
            $and: [
                {
                    $or: [
                        { captured: 'Failed' },
                        { authorized: 'Failed' },
                        { authorized: 'Success' },
                        { captured: 'Success' },
                        { status: 'Upcoming' },
                    ],
                },
                {
                    dueDate: {
                        $gte: startDate,
                        $lte: currentDate,
                    },
                },
            ],
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner.name', 'totalDebt'],
            populate: {
                path: 'debtor',
                select: ['basicInformation.fullName', 'basicInformation.SSID'],
            },
        });
    }
    async getCasePayments(id) {
        const payments = await this.getAllPaymentsByCaseId(id);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments);
        let paidAmount = 0, upcomingAmount = 0, failedAmount = 0;
        paidAmount = paymentsObj.successPayments.reduce((acc, payment) => acc + payment.amount, 0);
        upcomingAmount = paymentsObj.upcomingPayments.reduce((acc, payment) => acc + payment.amount, 0);
        failedAmount = paymentsObj.failedPayments.reduce((acc, payment) => acc + payment.amount, 0);
        const failedAuth = paymentsObj.failedAuthorizations.map((obj) => ({
            ...obj,
            type: 'authorization',
        }));
        // Adding type to each object in successCapture array
        const failedCapture = paymentsObj.failedPayments.map((obj) => ({
            ...obj,
            type: 'payment',
        }));
        const successAuth = paymentsObj.successAuthorizations.map((obj) => ({
            ...obj,
            type: 'authorization',
        }));
        // Adding type to each object in successCapture array
        const successCapture = paymentsObj.successPayments.map((obj) => ({
            ...obj,
            type: 'payment',
        }));
        // Merging the arrays
        const mergedArray = [
            ...successAuth,
            ...failedAuth,
            ...successCapture,
            ...failedCapture,
        ];
        const paymentCounts = {
            failedPayments: paymentsObj.failedPayments.length,
            successPayments: paymentsObj.successPayments.length,
            failedAuthorizations: paymentsObj.failedAuthorizations.length,
            successAuthorizations: paymentsObj.successAuthorizations.length,
            paidAmount: paidAmount,
            remainingAmount: upcomingAmount + failedAmount,
        };
        mergedArray.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        paymentsObj.upcomingPayments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        return [
            true,
            {
                transactions: {
                    previous: mergedArray,
                    upcomingPayments: paymentsObj.upcomingPayments,
                },
                paymentCounts: paymentCounts,
            },
        ];
    }
    async getAllPaymentsByCaseId(id) {
        return await this.paymentRepository.getAllWithoutPagination({
            caseId: id,
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner', 'totalDebt'],
            populate: {
                path: 'debtor',
                select: ['basicInformation.fullName', 'basicInformation.SSID'],
            },
        });
    }
    async authorizeCreditCard(amount, customer_vault_id) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            customer_vault_id: '1922739712',
            type: 'auth',
            amount: '20.00',
        };
        try {
            const response = await axios_1.default.get(url, { params });
            console.log('Response:', response.data);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Error making request:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                    console.error('Response headers:', error.response.headers);
                }
            }
            else {
                console.error('Unexpected error:', error);
            }
        }
    }
    async captureCreditCard(customer_vault_id, transactionId) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            customer_vault_id: '1922739712',
            transaction_id: '9604723257',
            stored_credential_indicator: 'used',
            type: 'capture',
        };
        try {
            const response = await axios_1.default.get(url, { params });
            console.log('Response:', response.data);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Error making request:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                    console.error('Response headers:', error.response.headers);
                }
            }
            else {
                console.error('Unexpected error:', error);
            }
        }
    }
    async achCredit(customer_vault_id, amount) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            customer_vault_id: '2023102910',
            stored_credential_indicator: 'used',
            type: 'credit',
            amount: '20.00',
            payment: 'check',
        };
        try {
            const response = await axios_1.default.get(url, { params });
            console.log('Response:', response.data);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Error making request:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                    console.error('Response headers:', error.response.headers);
                }
            }
            else {
                console.error('Unexpected error:', error);
            }
        }
    }
}
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map