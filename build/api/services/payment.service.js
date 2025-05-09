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
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const creditor_util_1 = __importDefault(require("../../utils/creditor.util"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const googleDrive_util_1 = __importDefault(require("../../utils/googleDrive.util"));
const attorney_repository_1 = require("../repository/attorney/attorney.repository");
const lawsuit_repository_1 = require("../repository/lawsuit/lawsuit.repository");
const lawsuit_util_1 = __importDefault(require("../../utils/lawsuit.util"));
dotenv_1.default.config();
class PaymentService {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.creditorReposiotry = new creditor_repository_1.CreditorRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.attorneyReposiotry = new attorney_repository_1.AttorneyRepository();
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
    }
    async getHomePayments(req) {
        let arrayName = String(req.query.arrayName);
        let days = Number(req.query.days);
        let counts = {};
        let filters = {
            caseId: { $eq: null },
            isDeleted: false,
        };
        let upcomingFilter = null;
        let dueDateFilter = null;
        if (days) {
            dueDateFilter = await this.getDaysFilterDueDate(days);
            upcomingFilter = await this.getDaysFilterUpcoming(days);
        }
        if (arrayName === 'default') {
            counts = await this.getCountForAllPaymentsStatus({ ...filters }, upcomingFilter, dueDateFilter);
        }
        const populatedFiltersResult = await this.populateFilterHomePayments({ ...filters }, req, upcomingFilter, dueDateFilter);
        let page = populatedFiltersResult.page;
        let limit = populatedFiltersResult.limit;
        const finalFilters = populatedFiltersResult.filters;
        const payments = await this.getAllPayments(req, finalFilters, page, limit, upcomingFilter, dueDateFilter);
        // if (!payments.length) {
        //   return [false, constants.notFoundMessage('Payments')];
        // }
        // const paymentsObj = await paymentUtil.getFilteredPayments(
        //   payments,
        //   arrayName
        // );
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
            if (payments[arrayName]) {
                payments[arrayName] = await payment_util_1.default.searchAndFilterHomePayments(payments[arrayName], req);
                counts[arrayName] = payments[arrayName]?.length;
                payments[arrayName] = payments[arrayName]?.slice((page - 1) * limit, page * limit);
            }
        }
        // const successPayments = structuredClone(paymentsObj.successPayments);
        // for (const payment of successPayments) {
        //   payment.transactionType = 'ACH';
        //   payment.paymentGateway = 'Paynote';
        // }
        // paymentsObj.successPayments = successPayments;
        return [
            true,
            {
                payments: payments,
                counts: counts,
            },
        ];
    }
    async getCreditorSuccessfulPayments(req) {
        let days = Number(req.query.days);
        let counts = {};
        let filters = {
            caseId: { $ne: null },
            isDeleted: false,
            $or: [{ lawsuitId: { $exists: false } }, { lawsuitId: { $eq: null } }],
        };
        if (days) {
            filters = await this.getDaysFilterPopulated(filters, days);
        }
        const populatedFiltersResult = await this.populateFilterCreditor({ ...filters }, req, 'sendViaPaynote', 'Success');
        let page = populatedFiltersResult.page;
        let limit = populatedFiltersResult.limit;
        let finalFilters = populatedFiltersResult.filters;
        let payments = await this.getAllPaymentsQuery(finalFilters, page, limit);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        // const paymentsObj = await paymentUtil.getFilteredPayments(
        //   payments,
        //   'successPayments'
        // );
        payments = await payment_util_1.default.getFilteredPaymentsCreditor(payments);
        if (req.query.filters !== 'true' && req.query.search !== 'true') {
            const count = await this.paymentRepository.getCount(finalFilters);
            console.log(finalFilters, 'hehehehe');
            counts['successPayments'] = count;
        }
        if (req.query.filters === 'true' || req.query.search === 'true') {
            if (req.query.page && !isNaN(Number(req.query.page))) {
                page = Number(req.query.page) ? Number(req.query.page) : page;
            }
            if (req.query.limit && !isNaN(Number(req.query.limit))) {
                limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
            }
            payments = await payment_util_1.default.searchAndFilterHomePayments(payments, req);
            counts['successPayments'] = payments?.length;
            payments = payments?.slice((page - 1) * limit, page * limit);
        }
        // const successPayments = structuredClone(paymentsObj.successPayments);
        // paymentsObj.successPayments = successPayments;
        return [
            true,
            {
                payments: payments,
                counts: counts,
            },
        ];
    }
    async getCreditorUpcomingPayments(req) {
        let days = Number(req.query.days);
        let counts = {};
        let filters = {
            caseId: { $ne: null },
            isDeleted: false,
            $or: [{ lawsuitId: { $exists: false } }, { lawsuitId: { $eq: null } }],
        };
        if (days) {
            let upcomingFilter = await this.getDaysFilterUpcoming(days);
            filters['dueDate'] = upcomingFilter;
        }
        const populatedFiltersResult = await this.populateFilterCreditor({ ...filters }, req, 'status', 'Upcoming');
        let page = populatedFiltersResult.page;
        let limit = populatedFiltersResult.limit;
        const finalFilters = populatedFiltersResult.filters;
        let payments = await this.getAllPaymentsQuery(finalFilters, page, limit);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        // const paymentsObj = await paymentUtil.getFilteredPayments(
        //   payments,
        //   'successPayments'
        // );
        payments = await payment_util_1.default.getFilteredPaymentsCreditor(payments);
        if (req.query.filters !== 'true' && req.query.search !== 'true') {
            const count = await this.paymentRepository.getCount(finalFilters);
            counts['creditorUpcomingPayments'] = count;
        }
        if (req.query.filters === 'true' || req.query.search === 'true') {
            if (req.query.page && !isNaN(Number(req.query.page))) {
                page = Number(req.query.page) ? Number(req.query.page) : page;
            }
            if (req.query.limit && !isNaN(Number(req.query.limit))) {
                limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
            }
            payments = await payment_util_1.default.searchAndFilterHomePayments(payments, req);
            counts['creditorUpcomingPayments'] = payments?.length;
            payments = payments?.slice((page - 1) * limit, page * limit);
        }
        return [
            true,
            {
                payments: payments,
                counts: counts,
            },
        ];
    }
    async populateFilterHomePayments(filters, req, upcomingFilter, dueDateFilter) {
        let page = 1;
        let limit = 5;
        let arrayName = String(req.query.arrayName);
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
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
                    if (dueDateFilter)
                        filters['dueDate'] = dueDateFilter;
                    break;
                // case 'successPayments':
                //   filters['sendViaPaynote'] = 'Success';
                //   filters['caseId'] = {$ne: null};
                //   break;
                case 'successCaptures':
                    filters['captured'] = 'Success';
                    if (dueDateFilter)
                        filters['dueDate'] = dueDateFilter;
                    break;
                case 'failedAuthorizations':
                    filters['authorized'] = 'Failed';
                    if (dueDateFilter)
                        filters['authorizedDate'] = dueDateFilter;
                    break;
                case 'successAuthorizations':
                    filters['authorized'] = 'Success';
                    if (dueDateFilter)
                        filters['authorizedDate'] = dueDateFilter;
                    break;
                case 'upcomingPayments':
                    filters['status'] = 'Upcoming';
                    if (upcomingFilter)
                        filters['dueDate'] = upcomingFilter;
                    break;
                default:
                    filters['authorized'] = 'Failed';
                    if (dueDateFilter)
                        filters['dueDate'] = upcomingFilter;
                    break;
            }
        }
        return { filters, page, limit };
    }
    async populateFilterCreditor(filters, req, name, status) {
        let page = 1;
        let limit = 5;
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
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
        filters[name] = status;
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
        return null;
    }
    async getDaysFilterDueDate(days) {
        if (days && (days === 3 || days === 5 || days === 7)) {
            let currentDate = common_util_1.default.getCurrentDate();
            const startDate = new Date(new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000).toUTCString();
            return {
                $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
                $lte: new Date(new Date(currentDate).setUTCHours(0, 0, 0, 0)),
            };
        }
        return null;
    }
    async getAllPayments(req, filters, page, limit, upcomingFilter, dueDateFilter) {
        let failedCaptures = [], successCaptures = [], successPayments = [], failedAuthorizations = [], successAuthorizations = [], upcomingPayments = [];
        const arrayName = String(req.query.arrayName);
        if (arrayName === 'default') {
            const failedAuth = { ...filters };
            failedAuth['authorized'] = 'Failed';
            if (dueDateFilter)
                failedAuth['authorizedDate'] = dueDateFilter;
            failedAuthorizations = await this.getAllPaymentsQuery(failedAuth, page, limit);
            const failedCapture = { ...filters };
            failedCapture['captured'] = 'Failed';
            if (dueDateFilter)
                failedCapture['dueDate'] = dueDateFilter;
            failedCaptures = await this.getAllPaymentsQuery(failedCapture, page, limit);
            const successAuth = { ...filters };
            successAuth['authorized'] = 'Success';
            successAuth['paymentMode'] = { $ne: 'Direct Post' };
            if (dueDateFilter)
                successAuth['authorizedDate'] = dueDateFilter;
            successAuthorizations = await this.getAllPaymentsQuery(successAuth, page, limit);
            const successCapture = { ...filters };
            successCapture['captured'] = 'Success';
            if (dueDateFilter)
                successCapture['dueDate'] = dueDateFilter;
            successCaptures = await this.getAllPaymentsQuery(successCapture, page, limit);
            const upcoming = { ...filters };
            upcoming['status'] = 'Upcoming';
            if (upcomingFilter)
                upcoming['dueDate'] = upcomingFilter;
            upcomingPayments = await this.getAllPaymentsQuery(upcoming, page, limit);
            // const successPayments = {...filters};
            // successPayments['sendViaPaynote'] = 'Success';
            // successPayments['caseId'] = {$ne: null};
            // const getSuccessPayments = await this.getAllPaymentsQuery(
            //   successPayments,
            //   page,
            //   limit
            // );
            // const mergedArray = [
            //   ...getFailedAuthPayments,
            //   ...getFailedCapturePayments,
            //   ...getSuccessAuthPayments,
            //   ...getSuccessCapturePayments,
            //   ...getUpcomingPayments,
            //   // ...getSuccessPayments,
            // ];
            return {
                failedCaptures: failedCaptures,
                successPayments: successPayments,
                failedAuthorizations: failedAuthorizations,
                successAuthorizations: successAuthorizations,
                upcomingPayments: upcomingPayments,
                successCaptures: successCaptures,
            };
            // return await this.getUniquePayments(mergedArray);
        }
        return { [arrayName]: await this.getAllPaymentsQuery(filters, page, limit) };
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
        return await this.paymentRepository.getAllWithoutPagination(filters, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status sendViaPaynote debtorTransId transactionType paymentGateway debtorName debtorId creditorName', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner', 'totalDebt'],
        }, undefined, page, limit);
    }
    async getCountForAllPaymentsStatus(filters, upcomingFilter, dueDateFilter) {
        const failedAuth = { ...filters };
        failedAuth['authorized'] = 'Failed';
        failedAuth['authorizedDate'] = dueDateFilter;
        const failedCapture = { ...filters };
        failedCapture['captured'] = 'Failed';
        failedCapture['dueDate'] = dueDateFilter;
        const successAuth = { ...filters };
        successAuth['authorized'] = 'Success';
        successAuth['authorizedDate'] = dueDateFilter;
        const successCapture = { ...filters };
        successCapture['captured'] = 'Success';
        successCapture['dueDate'] = dueDateFilter;
        const upcoming = { ...filters };
        upcoming['status'] = 'Upcoming';
        upcoming['dueDate'] = upcomingFilter;
        // const successPaynote = {...filters};
        // successPaynote['sendViaPaynote'] = 'Success';
        // successPaynote['caseId'] = {$ne: null};
        const successAuthorizations = await this.paymentRepository.getCount(successAuth);
        const failedCaptures = await this.paymentRepository.getCount(failedCapture);
        const failedAuthorizations = await this.paymentRepository.getCount(failedAuth);
        const successCaptures = await this.paymentRepository.getCount(successCapture);
        console.log(upcoming, 'upcoming');
        const upcomingPayments = await this.paymentRepository.getCount(upcoming);
        // const successPayments =
        //   await this.paymentRepository.getCount<IPayment>(successPaynote);
        return {
            failedAuthorizations: failedAuthorizations,
            // successPayments: successPayments,
            successAuthorizations: successAuthorizations,
            failedCaptures: failedCaptures,
            successCaptures: successCaptures,
            upcomingPayments: upcomingPayments,
        };
    }
    async getCasePayments(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const paymentsPrevious = await this.getPreviousPaymentsByCaseId(req.params.id);
        const paymentsUpcoming = await this.getUpcomingPaymentsByCaseId(req.params.id, pageLimit.page, pageLimit.limit);
        const paymentsUpcomingCount = await this.getUpcomingPaymentsByCaseIdCount(req.params.id);
        const paymentsObj = await payment_util_1.default.getFilteredPayments(paymentsPrevious, 'default');
        const upcomingPaymentsObj = await payment_util_1.default.getFilteredPayments(paymentsUpcoming, 'upcomingPayments');
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
            type: 'capture',
        }));
        const successAuth = paymentsObj.successAuthorizations.map((obj) => ({
            ...obj,
            type: 'authorization',
        }));
        // Adding type to each object in successCapture array
        const successCapture = paymentsObj.successCaptures.map((obj) => ({
            ...obj,
            type: 'capture',
        }));
        // Merging the arrays
        const mergedArray = [
            ...successAuth,
            ...failedAuth,
            ...successCapture,
            ...failedCapture,
        ];
        const paymentCounts = {
            failedCaptures: paymentsObj.failedCaptures.length,
            successCaptures: paymentsObj.successCaptures.length,
            failedAuthorizations: paymentsObj.failedAuthorizations.length,
            successAuthorizations: paymentsObj.successAuthorizations.length,
            successPayments: paymentsObj.successPayments.length,
            paidAmount: paidAmount,
            remainingAmount: parseFloat((upcomingAmount + failedAmount).toFixed(2)),
        };
        mergedArray.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        upcomingPaymentsObj.upcomingPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const paginatedArray = mergedArray.slice((pageLimit.page - 1) * pageLimit.limit, pageLimit.page * pageLimit.limit);
        return [
            true,
            {
                transactions: {
                    previous: paginatedArray,
                    upcomingPayments: upcomingPaymentsObj.upcomingPayments,
                    previousCount: mergedArray.length,
                    upcomingCount: paymentsUpcomingCount,
                },
                paymentCounts: paymentCounts,
            },
        ];
    }
    async getAllUpcomingPayments(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const payments = await this.getAllPaymentsByDebtor(req.params.id, pageLimit.page, pageLimit.limit);
        const paymentsCount = await this.getAllPaymentsByDebtorCount(req.params.id);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        // const paymentsObj = await paymentUtil.getFilteredPayments(
        //   payments,
        //   'default'
        // );
        return [
            true,
            {
                transactions: {
                    upcomingPayments: payments,
                    totalCount: paymentsCount,
                },
            },
        ];
    }
    async getCommissionPayments(req) {
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const paymentsPrevious = await this.getPreviousCommissionPayments();
        const paymentsUpcoming = await this.getUpcomingCommissionPayments(pageLimit.page, pageLimit.limit);
        const paymentsUpcomingCount = await this.getUpcomingCommissionPaymentsCount();
        // const newPaymentsArray = paymentsPrevious.concat(paymentsUpcoming);
        const paymentsObj = await payment_util_1.default.getFilteredCommissionPayments(paymentsPrevious);
        const upcomingPaymentsObj = await payment_util_1.default.getFilteredCommissionPayments(paymentsUpcoming);
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
        mergedArray.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        upcomingPaymentsObj.upcomingPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const paginatedArray = mergedArray.slice((pageLimit.page - 1) * pageLimit.limit, pageLimit.page * pageLimit.limit);
        return [
            true,
            {
                transactions: {
                    previous: paginatedArray,
                    upcomingPayments: upcomingPaymentsObj.upcomingPayments,
                    previousCount: mergedArray.length,
                    upcomingCount: paymentsUpcomingCount,
                },
            },
        ];
    }
    async getAllPaymentsByDebtor(id, page, limit) {
        return await this.paymentRepository.getAll({
            debtorId: id,
            caseId: { $ne: null },
            $or: [{ lawsuitId: { $exists: false } }, { lawsuitId: { $eq: null } }],
            isDeleted: false,
            status: 'Upcoming',
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status creditorName debtorName', undefined, { createdAt: -1 }, undefined, undefined, page, limit);
    }
    async getAllPaymentsByDebtorCount(id) {
        return await this.paymentRepository.getCount({
            debtorId: id,
            caseId: { $ne: null },
            $or: [{ lawsuitId: { $exists: false } }, { lawsuitId: { $eq: null } }],
            isDeleted: false,
            status: 'Upcoming',
        });
    }
    async getPreviousPaymentsByCaseId(id) {
        return await this.paymentRepository.getAllWithoutPagination({
            caseId: id,
            isDeleted: false,
            $or: [
                { authorized: 'Success' },
                { authorized: 'Failed' },
                { captured: 'Success' },
                { captured: 'Failed' },
                { lawsuitId: { $exists: false } },
                { lawsuitId: { $eq: null } },
            ],
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured failedReasonPaynote rescheduled status debtorTransId transactionType paymentGateway debtorName', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner', 'totalDebt'],
            populate: [
                {
                    path: 'debtor',
                    select: ['basicInformation.fullName', 'basicInformation.SSID'],
                },
                {
                    path: 'creditor',
                    select: ['basicInformation.fullName'],
                },
            ],
        });
    }
    async getUpcomingPaymentsByCaseId(id, page, limit) {
        return await this.paymentRepository.getAll({
            caseId: id,
            isDeleted: false,
            $or: [{ lawsuitId: { $exists: false } }, { lawsuitId: { $eq: null } }],
            status: 'Upcoming',
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured failedReasonPaynote rescheduled status debtorTransId transactionType paymentGateway debtorName', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner', 'totalDebt'],
            populate: [
                {
                    path: 'debtor',
                    select: ['basicInformation.fullName', 'basicInformation.SSID'],
                },
                {
                    path: 'creditor',
                    select: ['basicInformation.fullName'],
                },
            ],
        }, undefined, page, limit);
    }
    async getAttorneyPayments(page, limit, filter) {
        return await this.paymentRepository.getAll(filter, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured failedReasonPaynote rescheduled status debtorTransId transactionType paymentGateway debtorName creditorName sendViaPaynote', undefined, undefined, {
            path: 'caseId',
            select: ['_id'],
        }, undefined, page, limit);
    }
    async getAttorneyPaymentsCount(filter) {
        return await this.paymentRepository.getCount(filter);
    }
    async getUpcomingPaymentsByCaseIdCount(id) {
        return await this.paymentRepository.getCount({
            caseId: id,
            $or: [{ lawsuitId: { $exists: false } }, { lawsuitId: { $eq: null } }],
            isDeleted: false,
            status: 'Upcoming',
        });
    }
    async getPreviousCommissionPayments() {
        return await this.paymentRepository.getAllWithoutPagination({
            caseId: null,
            isDeleted: false,
            status: { $ne: 'Upcoming' },
            paymentMode: { $ne: 'Link' },
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status transactionType paymentGateway', undefined, { createdAt: -1 });
    }
    async getUpcomingCommissionPayments(page, limit) {
        return await this.paymentRepository.getAll({
            caseId: null,
            isDeleted: false,
            status: 'Upcoming',
            paymentMode: { $ne: 'Link' },
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status transactionType paymentGateway', undefined, { createdAt: -1 }, undefined, undefined, page, limit);
    }
    async getUpcomingCommissionPaymentsCount() {
        return await this.paymentRepository.getCount({
            caseId: null,
            isDeleted: false,
            status: 'Upcoming',
        });
    }
    async getSuccessCommissionPaymentsWithCaseId() {
        return await this.paymentRepository.getAllWithoutPagination({
            caseId: { $ne: null },
            isDeleted: false,
            captured: 'Success',
            commission: { $gt: 0 },
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status', undefined, { createdAt: -1 });
    }
    async authorizeCreditCard(amount, customer_vault_id, platform) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyPlatform(platform);
        const url = urlSecurityKey.url;
        const params = {
            security_key: urlSecurityKey.securityKey,
            customer_vault_id: customer_vault_id,
            type: 'auth',
            amount: amount,
        };
        console.log(params);
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url, { params });
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
    async captureCreditCard(customer_vault_id, transactionId, platform) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyPlatform(platform);
        const url = urlSecurityKey.url;
        const params = {
            security_key: urlSecurityKey.securityKey,
            customer_vault_id: customer_vault_id,
            transaction_id: transactionId,
            stored_credential_indicator: 'used',
            type: 'capture',
        };
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url, { params });
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
    async achCredit(customer_vault_id, amount, platform) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyPlatform(platform);
        const url = urlSecurityKey.url;
        const params = {
            security_key: urlSecurityKey.securityKey,
            customer_vault_id: customer_vault_id,
            stored_credential_indicator: 'used',
            type: 'sale',
            amount: amount,
            payment: 'check',
        };
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url, { params });
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
    async addAccount(req) {
        const type = req.body.platform;
        const data = req.body.data;
        switch (type) {
            case 'Seamlesschex':
                const user = await common_util_1.default.getUserByType(req.params.id, 'debtor');
                if (!user.obj) {
                    return [false, 'Debtor not found'];
                }
                const decryptedData = common_util_1.default.getDecryptedData(data);
                const routingNoExist = user.obj?.seamlesschexRountingIds?.includes(decryptedData.bankRouting);
                if (routingNoExist)
                    return [false, 'Routing Number already Exist.'];
                const updatedDebtor = await this.debtorRepository.updateById(user.obj._id, {
                    $push: {
                        accounts: {
                            $each: [
                                {
                                    paymentType: 'ACH',
                                    customerAccount: data,
                                    platform: 'Seamlesschex',
                                },
                            ],
                        },
                        seamlesschexRountingIds: { $each: [decryptedData.bankRouting] },
                    },
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                if (!updatedDebtor)
                    return [false, constants_util_2.default.failureUpdateMessage('Debtor')];
                return [true, 'Account added successfully'];
            case 'Paynote':
                req.query.type = 'debtor';
                const paynoteAccount = await this.addAccountACHDetails(req, true);
                if (!paynoteAccount[0])
                    return [false, paynoteAccount[1]];
                return [true, 'Account added successfully'];
        }
        return [true, 'Account added successfully'];
    }
    async addAccountACHDetails(req, addAccount) {
        const reqTemp = req;
        const type = reqTemp.query.type;
        const user = await common_util_1.default.getUserByType(req.params.id, type);
        if (!user.obj)
            return [false, constants_util_1.default.notFoundMessage('user')];
        const { name, email } = await common_util_1.default.getUserDetails(user.obj);
        const createCustomer = await paynote_util_1.default.createCustomer(user.obj._id, name, email, user.model, true);
        if (createCustomer.error)
            return [false, constants_util_2.default.failureAddMessage('Account')];
        console.log('data: ', createCustomer);
        const data = req.body.data;
        const paymentObj = common_util_1.default.getDecryptedData(data);
        const fundingSource = await paynote_util_1.default.addFundingSource(paymentObj, createCustomer.user.user_id);
        console.log('fundingSource:', fundingSource);
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
        if (addAccount) {
            const initialVerify = await paynote_util_1.default.initiateFundingSourceVerifcation(sourceId, createCustomer.user.user_id);
            console.log('initialVerify', initialVerify);
            if (initialVerify.error)
                return [false, initialVerify.message];
            const verifyFundingSource = await paynote_util_1.default.verifyFundingSource(sourceId);
            if (verifyFundingSource.error)
                return [false, verifyFundingSource.message];
            const updatedDebtor = await paynote_util_1.default.addPaynoteAccount(user.obj._id, createCustomer.user.user_id, sourceId);
            if (!updatedDebtor)
                return [false, constants_util_2.default.failureUpdateMessage('Debtor')];
            return [true, 'Account added successfully'];
        }
        return [true, constants_util_1.default.successAddMessage('ACH details')];
    }
    async addACHDetails(req) {
        const reqTemp = req;
        const type = reqTemp.query.type;
        const user = await common_util_1.default.getUserByType(req.params.id, type);
        if (!user.obj)
            return [false, constants_util_1.default.notFoundMessage('user')];
        const { name, email } = await common_util_1.default.getUserDetails(user.obj);
        if (!user.obj.paynoteUserId) {
            const data = await paynote_util_1.default.createCustomer(user.obj._id, name, email, user.model);
            if (data.error)
                return [false, data.message];
            console.log('data: ', data);
        }
        const data = req.body.data;
        const paymentObj = common_util_1.default.getDecryptedData(data);
        const updatedUser = await common_util_1.default.getUserByType(req.params.id, type);
        const fundingSource = await paynote_util_1.default.addFundingSource(paymentObj, updatedUser.obj.paynoteUserId);
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
        user.model.updateById(user.obj._id, {
            paynoteSourceId: fundingSource.funding_source.source_id,
            paynoteSourceVerified: true,
        });
        // paynoteUtil.initiateFundingSourceVerifcation(
        //   sourceId,
        //   creditor.paynoteUserId
        // );
        // paynoteUtil.verifyFundingSource(sourceId);
        return [true, constants_util_1.default.successAddMessage('ACH details')];
    }
    async updateACHDetails(req) {
        const reqTemp = req;
        const type = reqTemp.query.type;
        const user = await common_util_1.default.getUserByType(req.params.id, type);
        if (!user.obj)
            return [false, constants_util_1.default.notFoundMessage(`${type}`)];
        const data = req.body.data;
        const paymentObj = common_util_1.default.getDecryptedData(data);
        const fundingSource = await paynote_util_1.default.updateFundingSource(paymentObj, user);
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
        return [true, constants_util_1.default.successUpdateMessage('ACH details')];
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
                        'businessInformation.companyName',
                    ],
                },
                {
                    path: 'debtor',
                    select: [
                        '_id',
                        'basicInformation.fullName',
                        'businessInformation.companyName',
                    ],
                },
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
        if (!payment.caseId?.creditor?.paynoteUserId) {
            return [false, 'User not added in paynote!'];
        }
        if (!payment.caseId?.creditorPaymentsProceed) {
            return [false, 'Funds transfer for this creditor is paused'];
        }
        if (!payment.caseId?.creditor?.basicInformation?.fullName) {
            return [false, 'Creditor name is required'];
        }
        if (!payment.caseId?.debtor?.businessInformation?.companyName) {
            return [false, 'Debtor company name is required'];
        }
        if (payment.status === 'Success') {
            return [false, 'Payment already send'];
        }
        if (payment.caseId.creditor.paynoteUserId) {
            // const paynoteCustomer = await paynoteUtil.getCustomer(
            //   payment.caseId.creditor
            // );
            // if (paynoteCustomer.user.status === 'unverified')
            //   return [false, 'User is unverified for payments'];
            const paymentResult = await paynote_util_1.default.sendPayment(payment);
            if (paymentResult?.message === 'Server Error')
                return [false, constants_util_1.default.Messages.PAYNOTE_SERVER_ERROR];
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
                email_util_1.default.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
                return [false, message];
            }
            email_util_1.default.sendEmailOrSmsByEvent('successful_payment', '', payment._id, '');
            await this.paymentRepository.updateById(payment._id, {
                paynoteCheckId: paymentResult.check.check_id,
                sendViaPaynote: 'Success',
                status: 'Success',
            });
            const updatedCase = await this.caseRepository.updateById(payment.caseId._id, { $inc: { remainingAmountPaid: payment.amount } });
            if (updatedCase.remaining === updatedCase.remainingAmountPaid) {
                const creditors = await creditor_util_1.default.getCreditorsEmailForDebtor(String(payment.caseId.debtor._id), String(payment.caseId.creditor._id));
                email_util_1.default.sendEmailIfDebtorPaysDebt(payment.caseId, payment.caseId.debtor, creditors);
            }
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
            isExempt: false,
        });
        const updatePayments = await this.paymentRepository.updateMany({
            caseId: req.params.id,
            $or: [{ authorized: 'Pending' }, { authorized: 'Failed' }],
        }, {
            isDeleted: true,
        });
        // const updateDebtor = await this.debtorReposiotry.updateById<IPayment>(
        //   String(caseTemp.debtor),
        //   {
        //     weeklyCommission: 0,
        //   }
        // );
        if (!updateCase || !updatePayments)
            return [false, 'Failed to cancel payment plan'];
        return [true, 'Payment plan cancelled successfully'];
    }
    async cancelDebtorPaymentPlan(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const updateDebtor = await this.debtorRepository.updateById(req.params.id, {
            intervals: [],
            isExempt: false,
            paymentPauseCount: 0,
            lastPaymentPauseDate: '',
            paymentAmountCount: 0,
            lastPaymentAmountDate: '',
        });
        const updatePayments = await this.paymentRepository.updateMany({
            debtorId: req.params.id,
            $or: [{ authorized: 'Pending' }, { authorized: 'Failed' }],
            caseId: { $eq: null },
            paymentMode: { $ne: 'Link' },
        }, {
            isDeleted: true,
        });
        if (!updateDebtor || !updatePayments)
            return [false, 'Failed to cancel payment plan'];
        return [true, 'Payment plan cancelled successfully'];
    }
    async cancelAllDebtorPaymentPlan(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const updateDebtor = await this.debtorRepository.updateById(req.params.id, {
            intervals: [],
            isExempt: false,
            paymentPauseCount: 0,
            lastPaymentPauseDate: '',
            paymentAmountCount: 0,
            lastPaymentAmountDate: '',
        });
        const updateCommisionPayments = await this.paymentRepository.updateMany({
            debtorId: req.params.id,
            $or: [{ authorized: 'Pending' }, { authorized: 'Failed' }],
            caseId: { $eq: null },
            transactionType: { $ne: 'Link' },
        }, {
            isDeleted: true,
        });
        const debtorCases = await this.caseRepository.getAllWithoutPagination({
            debtor: req.params.id,
            isDeleted: { $ne: true },
        });
        if (!debtorCases)
            return [false, constants_util_1.default.notFoundMessage('case')];
        for (const caseTemp of debtorCases) {
            const updateCase = await this.caseRepository.updateById(caseTemp._id, {
                intervals: [],
                isExempt: false,
            });
            const updateCreditorPayments = await this.paymentRepository.updateMany({
                caseId: caseTemp._id,
                $or: [{ authorized: 'Pending' }, { authorized: 'Failed' }],
            }, {
                isDeleted: true,
            });
        }
        return [true, 'Payment plan cancelled successfully'];
    }
    async getRelatedPayments(req) {
        let payments = await this.paymentRepository.getAllWithoutPagination({
            debtorTransId: req.params.id,
        }, undefined, undefined, { _id: -1 });
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('payments')];
        }
        const groupedByTransId = payments.reduce((acc, item) => {
            if (!acc[item.debtorTransId]) {
                acc[item.debtorTransId] = [];
            }
            acc[item.debtorTransId].push(item);
            return acc;
        }, {});
        return [true, groupedByTransId];
    }
    async updatePaymentLinkStatus(req) {
        const payment = await this.paymentRepository.getOne({
            debtorTransId: req.params.token,
        });
        if (!payment)
            return [false, constants_util_1.default.notFoundMessage('payment link')];
        await this.paymentRepository.updateByOne({ debtorTransId: req.params.token }, { status: req.body.status });
        let results = null;
        let caseIds = null;
        if (req.body.status === 'Success') {
            const debtor = await this.debtorRepository.getOne({
                _id: payment.debtorId,
            });
            const creditorNames = await case_util_1.default.getCreditorNames(debtor, debtor.extractedFields);
            const caseTemp = await googleDrive_util_1.default.mapCreditorsCases(debtor.extractedFields, creditorNames);
            for (const bin of caseTemp) {
                bin['platform'] = true;
                bin.creditor.platform = true;
            }
            results = await case_util_1.default.createCreditorsCases({ data: caseTemp }, '', '', payment.debtorId);
            const caseList = Array.isArray(results[1]) ? results[1] : results;
            caseIds = caseList.map(result => ({
                caseId: result._id,
                caseCode: result.caseCode,
                debtorId: result.debtor,
                creditorId: result.creditor,
            }));
        }
        return [true, caseIds];
    }
    async getPaymentLinkStatus(req) {
        const payment = await this.paymentRepository.getOne({
            debtorTransId: req.params.token,
        });
        if (!payment)
            return [false, constants_util_1.default.notFoundMessage('status')];
        return [true, { status: payment.status }];
    }
    async updatePaymentInvoiceStatus(req) {
        const payment = await this.paymentRepository.getOne({
            debtorTransId: req.params.token,
        });
        if (!payment)
            return [false, constants_util_1.default.notFoundMessage('payment Invoice')];
        await this.paymentRepository.updateByOne({ debtorTransId: req.params.token }, { status: req.body.status });
        let results = null;
        let caseIds = null;
        if (req.body.status === 'Success') {
            const debtor = await this.debtorRepository.getOne({
                _id: payment.debtorId,
            });
            const creditorNames = await case_util_1.default.getCreditorNames(debtor, debtor.extractedFields);
            const caseTemp = await googleDrive_util_1.default.mapCreditorsCases(debtor.extractedFields, creditorNames);
            for (const bin of caseTemp) {
                bin['platform'] = true;
                bin.creditor.platform = true;
            }
            results = await case_util_1.default.createCreditorsCases({ data: caseTemp }, '', '', payment.debtorId);
            const caseList = Array.isArray(results[1]) ? results[1] : results;
            caseIds = caseList.map(result => ({
                caseId: result._id,
                caseCode: result.caseCode,
                debtorId: result.debtor,
                creditorId: result.creditor,
            }));
        }
        return [true, caseIds];
    }
    async addPaymentPlan(req) {
        let findCase = await this.caseRepository.getById(req.body.caseId, undefined, undefined, [{ path: 'creditor' }, { path: 'debtor' }]);
        if (!findCase) {
            return [false, constants_util_1.default.notFoundMessage('Case')];
        }
        let lawsuit = await this.lawsuitRepository.getOne({
            debtorId: findCase.debtor,
            creditorId: findCase.creditor._id,
            isDeleted: { $ne: true },
        });
        if (!lawsuit) {
            return [false, constants_util_1.default.notFoundMessage('Lawsuit')];
        }
        if (lawsuit.intervals && lawsuit.intervals.length)
            return [false, constants_util_1.default.alreadyExistsMessage('Payment plan')];
        req.body._id = req.body.caseId;
        req.body.debtor = findCase.debtor._id;
        // req.body.attorneyId = req.params.id;
        req.body.lawsuitId = lawsuit._id;
        lawsuit = await this.lawsuitRepository.updateByOne({
            // attorneyId: req.params.id,
            debtorId: findCase.debtor,
            creditorId: findCase.creditor._id,
            isDeleted: { $ne: true },
        }, {
            intervals: req.body.intervals,
            isExempt: req.body.isExempt,
        });
        console.log(lawsuit);
        req.body.intervals = lawsuit.intervals;
        req.body.debtorName = findCase.debtor.basicInformation.fullName;
        req.body.creditorName = findCase.creditor.basicInformation.fullName;
        case_util_1.default.createPayment(req.body);
        return [true, constants_util_1.default.successAddMessage('Payment plan')];
    }
    async updatePaymentDate(req) {
        let payment = await this.paymentRepository.getById(req.params.id);
        if (!payment)
            return [false, constants_util_1.default.notFoundMessage('payment')];
        let updatedPayment = await this.paymentRepository.updateById(req.params.id, {
            dueDate: req.body.date,
        });
        if (!updatedPayment)
            return [false, constants_util_1.default.failureUpdateMessage('payment')];
        return [true, []];
    }
    async checkInvoice(req) {
        if (req.body.event_type === 'transaction.sale.success') {
            const payment = await this.paymentRepository.getOne({
                debtorTransId: req.body.event_body.transaction_id,
            });
            if (!payment)
                return [false, constants_util_1.default.notFoundMessage('payment invoice')];
            await this.paymentRepository.updateByOne({
                debtorTransId: req.body.event_body.transaction_id,
                transactionType: req.body.event_body.transaction_type,
            }, { status: 'Success' });
            let results = null;
            let caseIds = null;
            const debtor = await this.debtorRepository.getOne({
                _id: payment.debtorId,
            });
            const creditorNames = await case_util_1.default.getCreditorNames(debtor, debtor.extractedFields);
            const caseTemp = await googleDrive_util_1.default.mapCreditorsCases(debtor.extractedFields, creditorNames);
            for (const bin of caseTemp) {
                bin['platform'] = true;
                bin.creditor.platform = true;
            }
            results = await case_util_1.default.createCreditorsCases({ data: caseTemp }, '', '', payment.debtorId);
            const caseList = Array.isArray(results[1]) ? results[1] : [];
            console.log(caseList, 'caseList');
            caseIds = caseList.map(result => ({
                caseId: result._id,
                caseCode: result.caseCode,
                debtorId: result.debtor,
                creditorId: result.creditor,
            }));
            console.log(caseIds, 'caseIds');
            let caseIdTemp = caseList.map(result => result._id);
            console.log(caseIdTemp, 'caseIdTemp');
            let caseData = await case_util_1.default.getCaseCreditorPartialData(caseIdTemp);
            console.log(caseData);
            return [
                true,
                {
                    casesCreated: caseData,
                    invoiceData: {
                        invoiceId: payment.debtorTransId,
                        transactionType: req.body.event_body.transaction_type,
                        paymentGateway: payment.paymentGateway,
                        status: 'Success',
                    },
                    debtorId: payment.debtorId,
                },
            ];
        }
        if (req.body.event_type === 'transaction.sale.failed') {
            const payment = await this.paymentRepository.getOne({
                debtorTransId: req.body.event_body.transaction_id,
            });
            if (!payment)
                return [false, constants_util_1.default.notFoundMessage('payment invoice')];
            await this.paymentRepository.updateByOne({ debtorTransId: req.body.event_body.transaction_id }, { status: 'Failed' });
            return [
                true,
                {
                    casesCreated: [],
                    invoiceData: {
                        invoiceId: payment.debtorTransId,
                        transactionType: payment.transactionType,
                        paymentGateway: payment.paymentGateway,
                        status: 'Failed',
                    },
                    debtorId: payment.debtorId,
                },
            ];
        }
        return [true, []];
    }
    async getInstantPayment(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            [false, constants_util_1.default.notFoundMessage('debtor')];
        let payment = await this.paymentRepository.getOne({
            debtorId: req.params.id,
            caseId: null,
            status: 'Upcoming',
            isDeleted: false,
        });
        if (!payment)
            return [false, constants_util_1.default.notFoundMessage('payment')];
        let amount = 0;
        let legalFeeAmount = 0;
        let serviceFeeAmount = 0;
        let otherPayments = [];
        if (!payment.caseId) {
            otherPayments = await payment_util_1.default.getOtherPayments(payment);
            legalFeeAmount = await lawsuit_util_1.default.getTotalLegalFee(otherPayments);
            serviceFeeAmount = await lawsuit_util_1.default.getTotalServiceFee(otherPayments.length ? [otherPayments[0]] : otherPayments);
            amount = payment.amount;
        }
        const response = await payment_util_1.default.getInstantPayment(amount, debtor, payment);
        if (response[0]) {
            const concatedPayments = otherPayments.concat(payment);
            const paymentObj = response[1];
            paymentObj['legalFee'] = legalFeeAmount;
            paymentObj['serviceFee'] = serviceFeeAmount;
            for (const payment of concatedPayments) {
                await this.paymentRepository.updateById(payment._id, paymentObj);
            }
        }
        if (!response[0])
            return [false, response[1].failedReasonAuthorization];
        return response;
    }
    async getCaseAttorneyPayments(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const lawSuit = await this.lawsuitRepository.getOne({
            debtorId: caseTemp.debtor,
            creditorId: caseTemp.creditor,
            isDeleted: { $ne: true },
        });
        if (!lawSuit)
            return [false, constants_util_1.default.notFoundMessage('lawsuit')];
        const filters = {
            caseId: caseTemp._id,
            lawsuitId: lawSuit._id,
            isDeleted: false,
        };
        const sendViaPaynoteFilter = {
            ...filters,
            $or: [{ sendViaPaynote: 'Success' }, { sendViaPaynote: 'Failed' }],
        };
        const upcomingFilter = {
            ...filters,
            status: 'Upcoming',
        };
        const payments = await this.getAttorneyPayments(pageLimit.page, pageLimit.limit, sendViaPaynoteFilter);
        const paymentsUpcoming = await this.getAttorneyPayments(pageLimit.page, pageLimit.limit, upcomingFilter);
        const paymentsUpcomingCount = await this.getAttorneyPaymentsCount(upcomingFilter);
        const paymentsCount = await this.getAttorneyPaymentsCount(sendViaPaynoteFilter);
        return [
            true,
            {
                payments,
                paymentsUpcoming,
                paymentsUpcomingCount,
                paymentsCount,
            },
        ];
    }
    async paynoteWebhook(req) {
        console.log(req.body, 'req.body');
        return paynote_util_1.default.paynoteWebhook(req.body);
    }
}
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map