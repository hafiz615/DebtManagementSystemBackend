"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const common_util_1 = __importDefault(require("./common.util"));
class PaymentUtil {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
    }
    async getFilteredPayments(payments) {
        const transformedArray = payments.map(obj => ({
            status: obj.status,
            caseOwner: obj.caseId?.caseOwner ? obj.caseId.caseOwner : '',
            totalDebt: obj.caseId?.totalDebt ? obj.caseId.totalDebt : 0,
            fullName: obj.caseId?.debtor
                ? obj.caseId.debtor.basicInformation.fullName
                : '',
            SSID: obj.caseId?.debtor ? obj.caseId.debtor?.basicInformation.SSID : '',
            authorized: obj.authorized,
            captured: obj.captured,
            amount: obj.amount,
            dueDate: obj.dueDate,
            failedReasonAuthorization: obj.failedReasonAuthorization,
            failedReasonCaptured: obj.failedReasonCaptured,
            tryDate: obj.rescheduled,
        }));
        return this.getFilteredPaymentsObj(transformedArray);
    }
    async getFilteredPaymentsObj(transformedArray) {
        const failedPayments = transformedArray.filter(payment => payment.captured === 'Failed');
        const successPayments = transformedArray.filter(payment => payment.captured === 'Success');
        const failedAuthorizations = transformedArray.filter(payment => payment.authorized === 'Failed');
        const successAuthorizations = transformedArray.filter(payment => payment.authorized === 'Success');
        const upcomingPayments = transformedArray.filter(payment => payment.status === 'Upcoming');
        return {
            failedPayments: failedPayments,
            successPayments: successPayments,
            failedAuthorizations: failedAuthorizations,
            successAuthorizations: successAuthorizations,
            upcomingPayments: upcomingPayments,
        };
    }
    async getAllCronJobPayments() {
        const pipeline = [
            {
                $facet: {
                    pendingAuthorized: [
                        { $match: { authorized: 'Pending' } },
                        {
                            $lookup: {
                                from: 'cases',
                                localField: 'caseId',
                                foreignField: '_id',
                                as: 'caseDetails',
                            },
                        },
                        { $unwind: '$caseDetails' },
                        {
                            $lookup: {
                                from: 'debtors',
                                localField: 'caseDetails.debtor',
                                foreignField: '_id',
                                as: 'caseDetails.debtorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.debtorDetails' },
                        {
                            $lookup: {
                                from: 'creditors',
                                localField: 'caseDetails.creditor',
                                foreignField: '_id',
                                as: 'caseDetails.creditorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.creditorDetails' },
                        {
                            $project: {
                                _id: 1,
                                caseId: 1,
                                caseDetails: 1,
                                authorized: 1,
                                captured: 1,
                                status: 1,
                                amount: 1,
                                dueDate: 1,
                                frequency: 1,
                                intervalId: 1,
                                failedReasonAuthorization: 1,
                                failedReasonCaptured: 1,
                                rescheduled: 1,
                                debtorTransId: 1,
                                retriesAuth: 1,
                                retriesCapture: 1,
                                commission: 1,
                                creditorAmount: 1,
                                timePeriod: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            },
                        },
                    ],
                    pendingCaptured: [
                        { $match: { authorized: 'Success', captured: 'Pending' } },
                        {
                            $lookup: {
                                from: 'cases',
                                localField: 'caseId',
                                foreignField: '_id',
                                as: 'caseDetails',
                            },
                        },
                        { $unwind: '$caseDetails' },
                        {
                            $lookup: {
                                from: 'debtors',
                                localField: 'caseDetails.debtor',
                                foreignField: '_id',
                                as: 'caseDetails.debtorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.debtorDetails' },
                        {
                            $lookup: {
                                from: 'creditors',
                                localField: 'caseDetails.creditor',
                                foreignField: '_id',
                                as: 'caseDetails.creditorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.creditorDetails' },
                        {
                            $project: {
                                _id: 1,
                                caseId: 1,
                                caseDetails: 1,
                                authorized: 1,
                                captured: 1,
                                status: 1,
                                amount: 1,
                                dueDate: 1,
                                frequency: 1,
                                intervalId: 1,
                                failedReasonAuthorization: 1,
                                failedReasonCaptured: 1,
                                rescheduled: 1,
                                transactionId: 1,
                                retriesAuth: 1,
                                retriesCapture: 1,
                                commission: 1,
                                creditorAmount: 1,
                                timePeriod: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            },
                        },
                    ],
                    failedAuthorized: [
                        { $match: { authorized: 'Failed' } },
                        {
                            $lookup: {
                                from: 'cases',
                                localField: 'caseId',
                                foreignField: '_id',
                                as: 'caseDetails',
                            },
                        },
                        { $unwind: '$caseDetails' },
                        {
                            $lookup: {
                                from: 'debtors',
                                localField: 'caseDetails.debtor',
                                foreignField: '_id',
                                as: 'caseDetails.debtorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.debtorDetails' },
                        {
                            $lookup: {
                                from: 'creditors',
                                localField: 'caseDetails.creditor',
                                foreignField: '_id',
                                as: 'caseDetails.creditorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.creditorDetails' },
                        {
                            $project: {
                                _id: 1,
                                caseId: 1,
                                caseDetails: 1,
                                authorized: 1,
                                captured: 1,
                                status: 1,
                                amount: 1,
                                dueDate: 1,
                                frequency: 1,
                                intervalId: 1,
                                failedReasonAuthorization: 1,
                                failedReasonCaptured: 1,
                                rescheduled: 1,
                                transactionId: 1,
                                retriesAuth: 1,
                                retriesCapture: 1,
                                commission: 1,
                                creditorAmount: 1,
                                timePeriod: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            },
                        },
                    ],
                    failedCaptured: [
                        { $match: { authorized: 'Success', captured: 'Failed' } },
                        {
                            $lookup: {
                                from: 'cases',
                                localField: 'caseId',
                                foreignField: '_id',
                                as: 'caseDetails',
                            },
                        },
                        { $unwind: '$caseDetails' },
                        {
                            $lookup: {
                                from: 'debtors',
                                localField: 'caseDetails.debtor',
                                foreignField: '_id',
                                as: 'caseDetails.debtorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.debtorDetails' },
                        {
                            $lookup: {
                                from: 'creditors',
                                localField: 'caseDetails.creditor',
                                foreignField: '_id',
                                as: 'caseDetails.creditorDetails',
                            },
                        },
                        { $unwind: '$caseDetails.creditorDetails' },
                        {
                            $project: {
                                _id: 1,
                                caseId: 1,
                                caseDetails: 1,
                                authorized: 1,
                                captured: 1,
                                status: 1,
                                amount: 1,
                                dueDate: 1,
                                frequency: 1,
                                intervalId: 1,
                                failedReasonAuthorization: 1,
                                failedReasonCaptured: 1,
                                rescheduled: 1,
                                transactionId: 1,
                                retriesAuth: 1,
                                retriesCapture: 1,
                                commission: 1,
                                creditorAmount: 1,
                                timePeriod: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            },
                        },
                    ],
                },
            },
        ];
        return await this.paymentRepository.applyAggregate(pipeline);
    }
    async getHomeFilters(req) {
        let arrayName = String(req.query.arrayName);
        let days = !Number(req.query.days) ? 3 : Number(req.query.days);
        let currentDate = common_util_1.default.getCurrentDate();
        const startDate = new Date(new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000).toUTCString();
        const filters = {};
        switch (arrayName) {
            case 'default':
                filters['$or'] = [
                    { captured: 'Failed' },
                    { authorized: 'Failed' },
                    { authorized: 'Success' },
                    { captured: 'Success' },
                    { status: 'Upcoming' },
                ];
                break;
            case 'failedPayments':
                filters['captured'] = 'Failed';
                break;
            case 'successPayments':
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
                filters['$or'] = [
                    { captured: 'Failed' },
                    { authorized: 'Failed' },
                    { authorized: 'Success' },
                    { captured: 'Success' },
                    { status: 'Upcoming' },
                ];
                break;
        }
        filters['dueDate'] = {
            $gte: startDate,
            $lte: currentDate,
        };
        filters['caseId'] = { $ne: null };
        if (req.query.filters === 'true') {
        }
        const matchDebtor = {};
        const matchCase = {};
        if (req.query.search === 'true') {
            const text = req.body.text;
            if (text) {
                matchDebtor['$or'] = [
                    { 'basicInformation.fullName': { $regex: text, $options: 'i' } }, // example filter for full name
                    { 'basicInformation.SSID': { $regex: text } }, // example filter for SSID
                ];
                matchCase['$or'] = [
                    { 'debtor.basicInformation.fullName': { $regex: text, $options: 'i' } }, // example filter for full name
                    { 'debtor.basicInformation.SSID': { $regex: text } }, // example filter for SSID
                    { caseOwner: { $regex: text, $options: 'i' } },
                ];
                // matchCase['caseOwner'] = {$regex: text, $options: 'i'};
                // matchCase['$or'] = [{caseOwner: {$regex: text, $options: 'i'}}];
            }
        }
        if (req.query.filters === 'true') {
            const bodyFilters = req.body.filters;
            if (bodyFilters.totalDebt) {
                matchCase['totalDebt'] = {
                    $gte: bodyFilters.totalDebt.min,
                    $lte: bodyFilters.totalDebt.max,
                };
            }
            if (bodyFilters.dueDate) {
                filters['dueDate'] = {
                    $gte: bodyFilters.dueDate.start,
                    $lte: bodyFilters.dueDate.end,
                };
            }
            if (bodyFilters.tryDate) {
                filters['rescheduled'] = {
                    $gte: bodyFilters.tryDate.start,
                    $lte: bodyFilters.tryDate.end,
                };
            }
        }
        return { filters, matchCase, matchDebtor };
    }
    async searchAndFilterHomePayments(payments, req) {
        // Helper function to apply text search
        const applyTextSearch = (paymentObj, text) => {
            const regex = new RegExp(text, 'i');
            return (regex.test(paymentObj.fullName) ||
                regex.test(paymentObj.caseOwner) ||
                regex.test(paymentObj.SSID));
        };
        // Helper function to apply numeric/date filters
        const applyFilters = (paymentObj, filters) => {
            if (filters.totalDebt &&
                (paymentObj.totalDebt < filters.totalDebt.min ||
                    paymentObj.totalDebt > filters.totalDebt.max)) {
                return false;
            }
            if (filters.dueDate &&
                (new Date(paymentObj.dueDate) < new Date(filters.dueDate.start) ||
                    new Date(paymentObj.dueDate) > new Date(filters.dueDate.end))) {
                return false;
            }
            if (filters.tryDate &&
                (new Date(paymentObj.tryDate) < new Date(filters.tryDate.start) ||
                    new Date(paymentObj.tryDate) > new Date(filters.tryDate.end))) {
                return false;
            }
            return true;
        };
        let text = '', filters = {};
        if (req.query.search === 'true') {
            text = req.body.text;
        }
        if (req.query.filters === 'true') {
            filters = req.body.filters;
        }
        // Apply text search and filters
        let filteredPayments = payments.filter(paymentObj => {
            const textMatches = !text || applyTextSearch(paymentObj, text);
            const filtersMatch = Object.keys(filters).length === 0 || applyFilters(paymentObj, filters);
            return textMatches && filtersMatch;
        });
        return filteredPayments;
    }
}
exports.default = new PaymentUtil();
//# sourceMappingURL=payment.util.js.map