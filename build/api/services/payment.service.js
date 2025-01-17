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
        const populatedFiltersResult = await this.populateFilterHomePayments({ ...filters }, req, upcomingFilter);
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
        const successPayments = structuredClone(paymentsObj.successPayments);
        for (const payment of successPayments) {
            payment.transactionType = 'ACH';
            payment.paymentGateway = 'Paynote';
        }
        paymentsObj.successPayments = successPayments;
        return [
            true,
            {
                payments: paymentsObj,
                counts: counts,
            },
        ];
    }
    async populateFilterHomePayments(filters, req, upcomingFilter) {
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
                    filters['sendViaPaynote'] = 'Success';
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
                    if (Object.keys(upcomingFilter).length)
                        filters['dueDate'] = upcomingFilter;
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
            if (Object.keys(upcomingFilter).length)
                upcoming['dueDate'] = upcomingFilter;
            const getUpcomingPayments = await this.getAllPaymentsQuery(upcoming, page, limit);
            const successPayments = { ...filters };
            successPayments['sendViaPaynote'] = 'Success';
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
        return await this.paymentRepository.getAllWithoutPagination(filters, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status sendViaPaynote debtorTransId transactionType paymentGateway', undefined, { createdAt: -1 }, {
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
        const successCapture = { ...filters };
        successCapture['captured'] = 'Success';
        const upcoming = { ...filters };
        upcoming['status'] = 'Upcoming';
        upcoming['dueDate'] = upcomingFilter;
        const successPaynote = { ...filters };
        successPaynote['sendViaPaynote'] = 'Success';
        const successAuthorizations = await this.paymentRepository.getCount(successAuth);
        const failedCaptures = await this.paymentRepository.getCount(failedCapture);
        const failedAuthorizations = await this.paymentRepository.getCount(failedAuth);
        const successCaptures = await this.paymentRepository.getCount(successCapture);
        console.log(upcoming, 'upcoming');
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
        const debtor = await this.debtorReposiotry.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const payments = await this.getAllPaymentsByDebtor(req.params.id, pageLimit.page, pageLimit.limit);
        const paymentsCount = await this.getAllPaymentsByDebtorCount(req.params.id);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments, 'default');
        return [
            true,
            {
                transactions: {
                    upcomingPayments: paymentsObj.upcomingPayments,
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
            isDeleted: false,
            status: 'Upcoming',
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status', undefined, { createdAt: -1 }, {
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
    async getAllPaymentsByDebtorCount(id) {
        return await this.paymentRepository.getCount({
            debtorId: id,
            caseId: { $ne: null },
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
            ],
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status debtorTransId transactionType paymentGateway', undefined, { createdAt: -1 }, {
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
            status: 'Upcoming',
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status debtorTransId transactionType paymentGateway', undefined, { createdAt: -1 }, {
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
    async getUpcomingPaymentsByCaseIdCount(id) {
        return await this.paymentRepository.getCount({
            caseId: id,
            isDeleted: false,
            status: 'Upcoming',
        });
    }
    async getPreviousCommissionPayments() {
        return await this.paymentRepository.getAllWithoutPagination({
            caseId: null,
            isDeleted: false,
            status: { $ne: 'Upcoming' },
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status transactionType paymentGateway', undefined, { createdAt: -1 });
    }
    async getUpcomingCommissionPayments(page, limit) {
        return await this.paymentRepository.getAll({
            caseId: null,
            isDeleted: false,
            status: 'Upcoming',
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
            type: 'credit',
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
    async addACHDetailsCreditor(req) {
        const creditor = await this.creditorReposiotry.getById(req.params.id);
        if (!creditor)
            return [false, constants_util_1.default.notFoundMessage('creditor')];
        const data = req.body.data;
        const paymentObj = common_util_1.default.getDecryptedData(data);
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
        // const sourceId = fundingSource.funding_source.source_id;
        // this.creditorReposiotry.updateById(creditor._id, {
        //   paynoteSourceId: fundingSource.funding_source.source_id,
        // });
        // paynoteUtil.initiateFundingSourceVerifcation(
        //   sourceId,
        //   creditor.paynoteUserId
        // );
        // paynoteUtil.verifyFundingSource(sourceId);
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
            isExempt: false,
        });
        const updatePayments = await this.paymentRepository.updateMany({ caseId: req.params.id, authorized: 'Pending' }, {
            isDeleted: true,
        });
        const updateDebtor = await this.debtorReposiotry.updateById(String(caseTemp.debtor), {
            weeklyCommission: 0,
        });
        if (!updateCase || !updatePayments || !updateDebtor)
            return [false, 'Failed to cancel payment plan'];
        return [true, 'Payment plan canceled successfully'];
    }
    async cancelDebtorPaymentPlan(req) {
        const debtor = await this.debtorReposiotry.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const updateDebtor = await this.debtorReposiotry.updateById(req.params.id, {
            intervals: [],
            isExempt: false,
        });
        const updatePayments = await this.paymentRepository.updateMany({ debtorId: req.params.id, authorized: 'Pending', caseId: { $eq: null } }, {
            isDeleted: true,
        });
        if (!updateDebtor || !updatePayments)
            return [false, 'Failed to cancel payment plan'];
        return [true, 'Payment plan canceled successfully'];
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
}
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map