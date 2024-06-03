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
    async getHomePayments(days) {
        if (!days)
            days = 3;
        let currentDate = common_util_1.default.getCurrentDate();
        const payments = await this.getAllPayments(currentDate, days);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments);
        return [true, paymentsObj];
    }
    async getAllPayments(currentDate, days) {
        const startDate = new Date(new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000).toUTCString();
        return await this.paymentRepository.getAll({
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
            select: ['_id', 'caseOwner', 'totalDebt'],
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
        const paymentCounts = {
            failedPayments: paymentsObj.failedPayments.length,
            successPayments: paymentsObj.successPayments.length,
            failedAuthorizations: paymentsObj.failedAuthorizations.length,
            successAuthorizations: paymentsObj.successAuthorizations.length,
            paidAmount: paidAmount,
            remainingAmount: upcomingAmount + failedAmount,
        };
        return [true, { transactions: paymentsObj, paymentCounts: paymentCounts }];
    }
    async getAllPaymentsByCaseId(id) {
        return await this.paymentRepository.getAll({
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
            amount: '0.00',
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
            transaction_id: '9561304895',
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
    async creditAmount() {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            customer_vault_id: '1922739712',
            type: 'credit',
            amount: '10.00',
        };
        try {
            const response = await axios_1.default.get(url, { params });
            console.log('Response:', response.data);
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