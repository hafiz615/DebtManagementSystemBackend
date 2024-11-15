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
const axiosInstanceInterceptor_1 = __importDefault(require("../../utils/axiosInstanceInterceptor"));
const creditor_repository_1 = require("../repository/creditor/creditor.repository");
const paynote_util_1 = __importDefault(require("../../utils/paynote.util"));
const n_krypta_1 = require("n-krypta");
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
dotenv_1.default.config();
class PaymentService {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.creditorReposiotry = new creditor_repository_1.CreditorRepository();
        this.debtorReposiotry = new debtor_repository_1.DebtorRepository();
    }
    async getHomePayments(req) {
        let arrayName = String(req.query.arrayName);
        let days = Number(req.query.days);
        let counts = {};
        let filters = {
            caseId: { $ne: null },
            isDeleted: false,
        };
        let upcomingFilter = {};
        if (days) {
            filters = await this.getDaysFilterPopulated(filters, days);
            upcomingFilter = await this.getDaysFilterUpcoming(days);
        }
        if (arrayName === 'default') {
            counts = await this.getCountForAllPaymentsStatus({ ...filters }, upcomingFilter);
        }
        const populatedFiltersResult = await this.populateFilterHomePayments({ ...filters }, req);
        let page = populatedFiltersResult.page;
        let limit = populatedFiltersResult.limit;
        const finalFilters = populatedFiltersResult.filters;
        const payments = await this.getAllPayments(req, finalFilters, page, limit, upcomingFilter);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments, arrayName);
        if (arrayName !== 'default' &&
            req.query.filters !== 'true' &&
            req.query.search !== 'true') {
            const count = await this.paymentRepository.getCount(finalFilters);
            counts[arrayName] = count;
        }
        if (arrayName !== 'default' &&
            (req.query.filters === 'true' || req.query.search === 'true')) {
            if (req.query.page && !isNaN(Number(req.query.page))) {
                page = Number(req.query.page) ? Number(req.query.page) : page;
            }
            if (req.query.limit && !isNaN(Number(req.query.limit))) {
                limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
            }
            if (paymentsObj[arrayName]) {
                paymentsObj[arrayName] = await payment_util_1.default.searchAndFilterHomePayments(paymentsObj[arrayName], req);
                counts[arrayName] = paymentsObj[arrayName]?.length;
                paymentsObj[arrayName] = paymentsObj[arrayName]?.slice((page - 1) * limit, page * limit);
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
    async populateFilterHomePayments(filters, req) {
        let page = 1;
        let limit = 5;
        let arrayName = String(req.query.arrayName);
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        // if (arrayName === 'default') {
        //   // Check if pageNumber and pageSize are provided and valid
        //   filters['$or'] = [
        //     {captured: 'Failed'},
        //     {authorized: 'Failed'},
        //     {authorized: 'Success'},
        //     {captured: 'Success'},
        //     {status: 'Upcoming'},
        //   ];
        // }
        let filtersApply;
        if (req.query.filters === 'true') {
            page = 0;
            limit = 0;
            filtersApply = req.body.filters;
            if (filtersApply?.dueDate) {
                filters['dueDate'] = {
                    $gte: filtersApply.dueDate.start,
                    $lte: filtersApply.dueDate.end,
                };
            }
            if (filtersApply?.tryDate) {
                filters['reschedule'] = {
                    $gte: filtersApply.tryDate.start,
                    $lte: filtersApply.tryDate.end,
                };
            }
        }
        if (req.query.search === 'true') {
            page = 0;
            limit = 0;
        }
        if (arrayName !== 'default') {
            switch (arrayName) {
                case 'failedCaptures':
                    filters['captured'] = 'Failed';
                    break;
                case 'successPayments':
                    filters['status'] = 'Success';
                    break;
                case 'successCaptures':
                    filters['captured'] = 'Success';
                    break;
                case 'failedAuthorizations':
                    filters['authorized'] = 'Failed';
                    break;
                case 'successAuthorizations':
                    filters['authorized'] = 'Success';
                    break;
                case 'upcomingPayments':
                    filters['status'] = 'Upcoming';
                    break;
                default:
                    filters['authorized'] = 'Failed';
                    break;
            }
        }
        return { filters, page, limit };
    }
    async getDaysFilterPopulated(filters, days) {
        if (days && (days === 3 || days === 5 || days === 7)) {
            let currentDate = common_util_1.default.getCurrentDate();
            const startDate = new Date(new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000).toUTCString();
            filters['dueDate'] = {
                $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
                $lte: new Date(new Date(currentDate).setUTCHours(0, 0, 0, 0)),
            };
        }
        return filters;
    }
    async getDaysFilterUpcoming(days) {
        if (days && (days === 3 || days === 5 || days === 7)) {
            let currentDate = common_util_1.default.getCurrentDate();
            const tillDate = new Date(new Date(currentDate).getTime() + days * 24 * 60 * 60 * 1000).toUTCString();
            return {
                $gte: new Date(new Date(currentDate).setUTCHours(0, 0, 0, 0)),
                $lte: new Date(new Date(tillDate).setUTCHours(0, 0, 0, 0)),
            };
        }
        return {};
    }
    async getAllPayments(req, filters, page, limit, upcomingFilter) {
        // let arrayName = String(req.query.arrayName);
        // const filters = {
        //   caseId: {$ne: null},
        //   isDeleted: false,
        // };
        // let page = 1;
        // let limit = 5;
        // if (arrayName === 'default') {
        //   // Check if pageNumber and pageSize are provided and valid
        //   if (req.query.page && !isNaN(Number(req.query.page))) {
        //     page = Number(req.query.page) ? Number(req.query.page) : page;
        //   }
        //   if (req.query.limit && !isNaN(Number(req.query.limit))) {
        //     limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        //   }
        //   filters['$or'] = [
        //     {captured: 'Failed'},
        //     {authorized: 'Failed'},
        //     {authorized: 'Success'},
        //     {captured: 'Success'},
        //     {status: 'Upcoming'},
        //   ];
        // } else {
        //   page = 0;
        //   limit = 0;
        //   let filtersApply: any;
        //   if (req.query.filters === 'true') {
        //     filtersApply = req.body.filters;
        //     if (filtersApply?.dueDate) {
        //       filters['dueDate'] = {
        //         $gte: filtersApply.dueDate.start,
        //         $lte: filtersApply.dueDate.end,
        //       };
        //     }
        //     if (filtersApply?.tryDate) {
        //       filters['reschedule'] = {
        //         $gte: filtersApply.tryDate.start,
        //         $lte: filtersApply.tryDate.end,
        //       };
        //     }
        //   }
        //   switch (arrayName) {
        //     case 'failedPayments':
        //       filters['captured'] = 'Failed';
        //       break;
        //     case 'successPayments':
        //       filters['captured'] = 'Success';
        //       break;
        //     case 'failedAuthorizations':
        //       filters['authorized'] = 'Failed';
        //       break;
        //     case 'successAuthorizations':
        //       filters['authorized'] = 'Success';
        //       break;
        //     case 'upcomingPayments':
        //       filters['status'] = 'Upcoming';
        //       break;
        //     default:
        //       filters['captured'] = 'Failed';
        //       break;
        //   }
        // }
        // let days = Number(req.query.days);
        // if (days && (days === 3 || days === 5 || days === 7)) {
        //   let currentDate = commonUtil.getCurrentDate();
        //   const startDate = new Date(
        //     new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
        //   ).toUTCString();
        //   filters['dueDate'] = {
        //     $gte: startDate,
        //     $lte: currentDate,
        //   };
        // }
        if (String(req.query.arrayName) === 'default') {
            const failedAuth = { ...filters };
            failedAuth['authorized'] = 'Failed';
            const getFailedAuthPayments = await this.getAllPaymentsQuery(failedAuth, page, limit);
            const failedCapture = { ...filters };
            failedCapture['captured'] = 'Failed';
            const getFailedCapturePayments = await this.getAllPaymentsQuery(failedCapture, page, limit);
            const successAuth = { ...filters };
            successAuth['authorized'] = 'Success';
            const getSuccessAuthPayments = await this.getAllPaymentsQuery(successAuth, page, limit);
            const successCapture = { ...filters };
            successCapture['captured'] = 'Success';
            const getSuccessCapturePayments = await this.getAllPaymentsQuery(successCapture, page, limit);
            const upcoming = { ...filters };
            upcoming['status'] = 'Upcoming';
            upcoming['dueDate'] = upcomingFilter;
            const getUpcomingPayments = await this.getAllPaymentsQuery(upcoming, page, limit);
            const successPayments = { ...filters };
            successPayments['status'] = 'Success';
            const getSuccessPayments = await this.getAllPaymentsQuery(successPayments, page, limit);
            const mergedArray = [
                ...getFailedAuthPayments,
                ...getFailedCapturePayments,
                ...getSuccessAuthPayments,
                ...getSuccessCapturePayments,
                ...getUpcomingPayments,
                ...getSuccessPayments,
            ];
            return await this.getUniquePayments(mergedArray);
        }
        return await this.getAllPaymentsQuery(filters, page, limit);
    }
    async getUniquePayments(payments) {
        const uniqueObjects = payments.reduce((acc, current) => {
            const id = current._id.toString(); // Convert ObjectId to string to ensure proper comparison
            if (!acc.has(id)) {
                acc.set(id, current);
            }
            return acc;
        }, new Map());
        return Array.from(uniqueObjects.values());
    }
    async getAllPaymentsQuery(filters, page, limit) {
        return await this.paymentRepository.getAllWithoutPagination(filters, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner', 'totalDebt'],
            populate: {
                path: 'debtor',
                select: ['basicInformation.fullName', 'basicInformation.SSID'],
            },
        }, undefined, page, limit);
    }
    async getCountForAllPaymentsStatus(filters, upcomingFilter) {
        const failedAuth = { ...filters };
        failedAuth['authorized'] = 'Failed';
        const failedCapture = { ...filters };
        failedCapture['captured'] = 'Failed';
        const successAuth = { ...filters };
        successAuth['authorized'] = 'Success';
        console.log(successAuth, 'successAuth');
        const successCapture = { ...filters };
        successCapture['captured'] = 'Success';
        const upcoming = { ...filters };
        upcoming['status'] = 'Upcoming';
        upcoming['dueDate'] = upcomingFilter;
        const successPaynote = { ...filters };
        successPaynote['status'] = 'Success';
        const successAuthorizations = await this.paymentRepository.getCount(successAuth);
        const failedCaptures = await this.paymentRepository.getCount(failedCapture);
        const failedAuthorizations = await this.paymentRepository.getCount(failedAuth);
        const successCaptures = await this.paymentRepository.getCount(successCapture);
        const upcomingPayments = await this.paymentRepository.getCount(upcoming);
        const successPayments = await this.paymentRepository.getCount(successPaynote);
        return {
            failedAuthorizations: failedAuthorizations,
            successPayments: successPayments,
            successAuthorizations: successAuthorizations,
            failedCaptures: failedCaptures,
            successCaptures: successCaptures,
            upcomingPayments: upcomingPayments,
        };
    }
    async getCasePayments(id) {
        const payments = await this.getAllPaymentsByCaseId(id);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments, 'default');
        let paidAmount = 0, upcomingAmount = 0, failedAmount = 0;
        paidAmount = paymentsObj.successPayments.reduce((acc, payment) => acc + payment.amount, 0);
        upcomingAmount = paymentsObj.upcomingPayments.reduce((acc, payment) => acc + payment.amount, 0);
        failedAmount = paymentsObj.failedCaptures.reduce((acc, payment) => acc + payment.amount, 0);
        const failedAuth = paymentsObj.failedAuthorizations.map((obj) => ({
            ...obj,
            type: 'authorization',
        }));
        // Adding type to each object in successCapture array
        const failedCapture = paymentsObj.failedCaptures.map((obj) => ({
            ...obj,
            type: 'payment',
        }));
        const successAuth = paymentsObj.successAuthorizations.map((obj) => ({
            ...obj,
            type: 'authorization',
        }));
        // Adding type to each object in successCapture array
        const successCapture = paymentsObj.successCaptures.map((obj) => ({
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
            failedPayments: paymentsObj.failedCaptures.length,
            successPayments: paymentsObj.successCaptures.length,
            failedAuthorizations: paymentsObj.failedAuthorizations.length,
            successAuthorizations: paymentsObj.successAuthorizations.length,
            paidAmount: paidAmount,
            remainingAmount: upcomingAmount + failedAmount,
        };
        mergedArray.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        paymentsObj.upcomingPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
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
            isDeleted: false,
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
            customer_vault_id: customer_vault_id,
            type: 'auth',
            amount: amount,
        };
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url, { params });
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
    async captureCreditCard(customer_vault_id, transactionId, creditorSecurityKey) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            customer_vault_id: customer_vault_id,
            transaction_id: transactionId,
            stored_credential_indicator: 'used',
            type: 'capture',
        };
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url, { params });
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
    async achCredit(customer_vault_id, amount, creditorSecurityKey) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            customer_vault_id: customer_vault_id,
            stored_credential_indicator: 'used',
            type: 'credit',
            amount: amount,
            payment: 'check',
        };
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url, { params });
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
    async addACHDetailsCreditor(req) {
        const creditor = await this.creditorReposiotry.getById(req.params.id);
        if (!creditor)
            return [false, constants_util_1.default.notFoundMessage('creditor')];
        const data = req.body.data;
        const paymentObj = (0, n_krypta_1.decrypt)(data, process.env.kryptaSecretKey);
        if (!creditor.paynoteUserId)
            return [false, 'User is not added in paynote!'];
        const fundingSource = await paynote_util_1.default.addFundingSource(paymentObj, creditor.paynoteUserId);
        if (fundingSource?.error) {
            let message = '';
            if (fundingSource?.messages) {
                message = fundingSource.messages[0];
            }
            else {
                message = fundingSource.message;
            }
            return [false, message];
        }
        const sourceId = fundingSource.funding_source.source_id;
        this.creditorReposiotry.updateById(creditor._id, {
            paynoteSourceId: fundingSource.funding_source.source_id,
        });
        paynote_util_1.default.initiateFundingSourceVerifcation(sourceId, creditor.paynoteUserId);
        paynote_util_1.default.verifyFundingSource(sourceId);
        return [true, constants_util_1.default.successAddMessage('ACH details')];
    }
    async sendPaymentPaynote(req) {
        const paymentId = req.params.id;
        const payment = await this.paymentRepository.getById(paymentId, undefined, undefined, {
            path: 'caseId',
            select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
            populate: [
                {
                    path: 'creditor',
                    select: [
                        'paynoteSourceId',
                        'paynoteUserId',
                        'basicInformation.fullName',
                    ],
                },
                { path: 'debtor', select: ['_id', 'basicInformation.fullName'] },
            ],
        });
        const interval = {
            unit: 'days',
            value: 1,
            maxRetry: 2,
        };
        if (!payment) {
            return [false, constants_util_2.default.notFoundMessage('payment')];
        }
        if (!payment.caseId?.creditor?.paynoteSourceId) {
            return [false, 'Account not added for user'];
        }
        if (!payment.caseId?.creditorPaymentsProceed) {
            return [false, 'Funds transfer for this creditor is paused'];
        }
        if (payment.status === 'Success') {
            return [false, 'Payment already send'];
        }
        if (payment.caseId.creditor.paynoteUserId &&
            payment.caseId.creditor.paynoteSourceId) {
            // const paynoteCustomer = await paynoteUtil.getCustomer(
            //   payment.caseId.creditor
            // );
            // if (paynoteCustomer.user.status === 'unverified')
            //   return [false, 'User is unverified for payments'];
            const paymentResult = await paynote_util_1.default.sendPayment(payment);
            if (paymentResult.error) {
                let message = '';
                if (paymentResult?.messages) {
                    message = paymentResult.messages[0];
                }
                else {
                    message = paymentResult.message;
                }
                const retry = payment.retriesAuth + 1;
                const value = interval.value * retry;
                const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
                await this.paymentRepository.updateById(payment._id, {
                    sendViaPaynote: 'Failed',
                    rescheduled: retryDate,
                    failedReasonPaynote: message,
                });
                // emailUtil.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
                return [false, message];
            }
            // emailUtil.sendEmailOrSmsByEvent(
            //   'successful_payment',
            //   '',
            //   payment._id,
            //   ''
            // );
            await this.paymentRepository.updateById(payment._id, {
                paynoteCheckId: paymentResult.check.check_id,
                sendViaPaynote: 'Success',
                status: 'Success',
            });
            const updatedCase = await this.caseRepository.updateById(payment.caseId._id, { $inc: { remainingAmountPaid: payment.amount } });
            // if (updatedCase.remaining === updatedCase.remainingAmountPaid) {
            //   const creditors = await creditorUtil.getCreditorsEmailForDebtor(
            //     String(payment.caseId.debtor._id),
            //     String(payment.caseId.creditor._id)
            //   );
            //   emailUtil.sendEmailIfDebtorPaysDebt(
            //     payment.caseId,
            //     payment.caseId.debtor,
            //     creditors
            //   );
            // }
        }
        return [true, 'Payment Successfull'];
    }
    getRetryDate(unit, value, dueDate) {
        const dueDateTemp = new Date(dueDate);
        let thresholdDate = new Date(dueDateTemp);
        switch (unit) {
            case 'hours':
                thresholdDate.setHours(dueDateTemp.getHours() + value);
                break;
            case 'days':
                thresholdDate.setDate(dueDateTemp.getDate() + value);
                break;
            default:
                throw new Error(`Unsupported unit: ${unit}`);
        }
        return thresholdDate.toUTCString();
    }
    async cancelCasePaymentPlan(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const updateCase = await this.caseRepository.updateById(req.params.id, {
            intervals: [],
        });
        const updatePayments = await this.paymentRepository.updateMany({ caseId: req.params.id, authorized: 'Pending' }, {
            isDeleted: true,
        });
        const updateDebtor = await this.debtorReposiotry.updateById(String(caseTemp.debtor), {
            weeklyCommission: 0,
        });
        if (!updateCase || !updatePayments || updateDebtor)
            return [false, 'Failed to cancel payment plan'];
        return [true, 'Payment plan canceled successfully'];
    }
    async cancelDebtorPaymentPlan(req) {
        const debtor = await this.debtorReposiotry.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const updateDebtor = await this.debtorReposiotry.updateById(req.params.id, {
            intervals: [],
        });
        const updatePayments = await this.paymentRepository.updateMany({ debtorId: req.params.id, authorized: 'Pending', caseId: { $eq: null } }, {
            isDeleted: true,
        });
        if (!updateDebtor || !updatePayments)
            return [false, 'Failed to cancel payment plan'];
        return [true, 'Payment plan canceled successfully'];
    }
}
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map