"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const contact_repository_1 = require("../api/repository/contact/contact.repository");
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const contact_repomodel_1 = require("../database/repomodels/contact.repomodel");
const creditor_repomodel_1 = require("../database/repomodels/creditor.repomodel");
const debtor_repomodel_1 = require("../database/repomodels/debtor.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const payment_repomodel_1 = require("../database/repomodels/payment.repomodel");
const case_repository_1 = require("../api/repository/case/case.repository");
const debtor_service_1 = __importDefault(require("../api/services/debtor.service"));
const creditor_service_1 = __importDefault(require("../api/services/creditor.service"));
const case_repomodel_1 = require("../database/repomodels/case.repomodel");
const constants_util_1 = __importDefault(require("./constants.util"));
const mongoose_1 = __importDefault(require("mongoose"));
const paymentLogging_repository_1 = require("../api/repository/paymentLogging/paymentLogging.repository");
const uuid_1 = require("uuid");
class CaseUtil {
    constructor() {
        this.contactRepository = new contact_repository_1.ContactRepository();
        this.debtRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.debtorService = new debtor_service_1.default();
        this.creditorService = new creditor_service_1.default();
        this.paymentLoggingRepository = new paymentLogging_repository_1.PaymentLoggingRepository();
    }
    async createContacts(data) {
        const validatedContacts = [];
        for (const contact of data) {
            const newContact = new contact_repomodel_1.Contact();
            const validatedContact = dataCopier_util_1.DataCopier.copy(newContact, contact);
            validatedContacts.push(validatedContact);
        }
        const contacts = await this.contactRepository.createMany(validatedContacts);
        return contacts.map(contact => {
            return contact._id;
        });
    }
    async createDebtor(data) {
        const newDebtor = new debtor_repomodel_1.Debtor();
        const validatedDebtor = dataCopier_util_1.DataCopier.copy(newDebtor, data);
        return await this.debtRepository.create(validatedDebtor);
    }
    async createCreditor(data) {
        const newCreditor = new creditor_repomodel_1.Creditor();
        const validatedCreditor = dataCopier_util_1.DataCopier.copy(newCreditor, data);
        return await this.creditorRepository.create(validatedCreditor);
    }
    async uploadFileFormat(originalFile) {
        const parsesdPath = (0, path_1.parse)(originalFile);
        const fileName = parsesdPath.name;
        const extension = parsesdPath.ext.toLowerCase();
        return `${fileName}-${Date.now()}${extension}`;
    }
    async createPayment(data) {
        const payment = new payment_repomodel_1.Payment();
        const paymentsArray = [];
        let tempPayment = null;
        let commission = 0;
        for (const interval of data.intervals) {
            if (interval.frequency === 0) {
                payment.dueDate = interval.startDate;
                tempPayment = await this.populatePayment(data._id, payment, interval, 0);
                paymentsArray.push(tempPayment);
            }
            if (interval.frequency != 0) {
                for (let i = 1; i <= interval.frequency; i++) {
                    if (i === 1) {
                        payment.dueDate = interval.startDate;
                    }
                    else {
                        payment.dueDate = await this.getDatePayment(interval.startDate, interval.timePeriod, i - 1);
                    }
                    tempPayment = await this.populatePayment(data._id, payment, interval, i);
                    paymentsArray.push(tempPayment);
                }
            }
        }
        await this.paymentRepository.createMany(paymentsArray);
        await this.paymentLoggingRepository.createMany(paymentsArray);
    }
    async calculateCommision(interval, weeklyBudget) {
        switch (interval.timePeriod.toLowerCase()) {
            case 'custom':
                return weeklyBudget <= interval.amount
                    ? 0
                    : weeklyBudget - interval.amount;
            case 'daily':
                if (weeklyBudget > interval.amount) {
                    const totalCommission = weeklyBudget - interval.amount;
                    return parseInt((totalCommission / interval.frequency).toFixed(2));
                }
                return 0;
            case 'weekly':
                return weeklyBudget <= interval.amount
                    ? 0
                    : weeklyBudget - interval.amount;
            case 'monthly':
                if (weeklyBudget > interval.amount) {
                    const totalCommission = weeklyBudget - interval.amount;
                    return parseInt((totalCommission * 4).toFixed(2));
                }
                return 0;
            case 'fortnightly':
                if (weeklyBudget > interval.amount) {
                    const totalCommission = weeklyBudget - interval.amount;
                    return parseInt((totalCommission * 2).toFixed(2));
                }
                return 0;
            default:
                throw new Error('Invalid time period');
        }
    }
    async getDatePayment(date, timePeriod, number) {
        const currentDate = new Date(date);
        switch (timePeriod.toLowerCase()) {
            case 'daily':
                currentDate.setDate(currentDate.getDate() + number);
                break;
            case 'weekly':
                currentDate.setDate(currentDate.getDate() + number * 7);
                break;
            case 'monthly':
                currentDate.setMonth(currentDate.getMonth() + number);
                break;
            case 'fortnightly':
                currentDate.setDate(currentDate.getDate() + number * 14);
                break;
            default:
                throw new Error('Invalid time period');
        }
        return currentDate.toString();
    }
    async populatePayment(caseId, payment, interval, frequency) {
        const uuid = (0, uuid_1.v4)();
        payment.amount = interval.amount;
        payment.frequency = frequency;
        payment.caseId = caseId;
        payment.intervalId = String(interval._id);
        payment.timePeriod = interval.timePeriod;
        payment.paymentReference = uuid;
        return { ...payment };
    }
    async getCaseCode() {
        const count = await this.caseRepository.getCount();
        if (!count)
            return 'CASE-001';
        // let caseCode = cases[cases.length - 1].caseCode;
        return 'CASE-' + (count + 1).toString().padStart(3, '0');
    }
    async getAllCreditorsOfDebtor(debtor) {
        const cases = await this.caseRepository.getAllWithoutPagination({ debtor: debtor._id }, 'totalDebt caseCode status', undefined, undefined, { path: 'creditor', select: ['basicInformation.fullName'] });
        const tempCases = cases;
        return tempCases.map(obj => ({
            totalDebt: obj.totalDebt,
            caseCode: obj.caseCode,
            status: obj.status,
            name: obj.creditor.basicInformation.fullName,
            caseId: String(obj._id),
        }));
    }
    async createCase(body, name, id) {
        let contactIds = null;
        let debtor = null;
        let creditor = null;
        const getDebtor = await this.debtRepository.getOne({
            $or: [
                {
                    'basicInformation.email': body.debtor.basicInformation.email.toLowerCase(),
                },
                {
                    'basicInformation.SSID': body.debtor.basicInformation.SSID,
                },
                {
                    'basicInformation.phone': body.debtor.basicInformation.phone,
                },
            ],
        });
        const getCreditor = await this.creditorRepository.getOne({
            $or: [
                {
                    'basicInformation.email': body.creditor.basicInformation.email.toLowerCase(),
                },
                {
                    'basicInformation.phone': body.creditor.basicInformation.phone,
                },
            ],
        });
        let weeklyBudgetObj;
        if (!getDebtor) {
            if (body.feePayment === 'toPay') {
                weeklyBudgetObj = await this.checkWeeklyBudget(body, false, null);
                if (!weeklyBudgetObj.status) {
                    return [
                        false,
                        'Weekly budget is not fulfiling the payment plan of debtor',
                    ];
                }
                body.debtor.totalCommission = weeklyBudgetObj.totalCommission;
                body.debtor.weeklyCommission = weeklyBudgetObj.commission;
            }
            // contactIds = await this.createContacts(
            //   body.debtor.contacts as IContact[]
            // );
            // const debtorData = {
            //   ...body.debtor,
            // };
            debtor = await this.createDebtor(body.debtor);
        }
        if (!getCreditor) {
            // contactIds = await this.createContacts(
            //   body.creditor.contacts as IContact[]
            // );
            // const creditorData = {
            //   ...body.creditor,
            //   contacts: contactIds,
            // };
            creditor = await this.createCreditor(body.creditor);
        }
        if (getDebtor) {
            debtor = getDebtor;
            if (body.feePayment === 'toPay') {
                weeklyBudgetObj = await this.checkWeeklyBudget(body, true, getDebtor);
                if (!weeklyBudgetObj.status) {
                    return [
                        false,
                        'Weekly budget is not fulfiling the payment plan of debtor',
                    ];
                }
                body.debtor.totalCommission = weeklyBudgetObj.totalCommission;
                body.debtor.weeklyCommission = weeklyBudgetObj.commission;
            }
            await this.debtRepository.updateById(getDebtor._id, body.debtor);
        }
        if (getCreditor) {
            creditor = getCreditor;
            await this.creditorRepository.updateById(getCreditor._id, body.creditor);
        }
        body.debtor = debtor?._id;
        body.creditor = creditor?._id;
        const newCase = new case_repomodel_1.Case();
        newCase.caseOwner = name;
        newCase.caseOwnerId = id;
        newCase.negotiator = name;
        newCase.negotiatorId = id;
        newCase.manager = name;
        newCase.managerId = id;
        console.log(await this.getCaseCode());
        newCase.caseCode = await this.getCaseCode();
        const validatedCase = dataCopier_util_1.DataCopier.copy(newCase, body);
        const caseCreated = await this.caseRepository.create(validatedCase);
        if (!caseCreated) {
            return [false, constants_util_1.default.failureAddMessage('case')];
        }
        await this.createPayment(caseCreated);
        if (body.paymentToken && body.paymentType) {
            await this.debtorService.createVault(body.paymentToken, String(caseCreated.debtor), body.paymentType);
        }
        return [true, caseCreated];
    }
    async checkWeeklyBudget(body, debtorFound, debtor) {
        let weeklyBudget = 0;
        let debt = 0;
        let amount = 0;
        if (!debtorFound) {
            const interval = body.intervals[0];
            weeklyBudget = body.debtor.basicInformation.weeklyBudget;
            debt = body.remaining;
            amount = await this.getWeeklyAmount(interval);
            return amount >= weeklyBudget
                ? {
                    status: false,
                    commission: 0,
                    totalCommission: 0,
                }
                : {
                    status: true,
                    commission: weeklyBudget - amount,
                    totalCommission: parseInt((debt * 0.19).toFixed(2)),
                };
        }
        weeklyBudget = body.debtor.basicInformation.weeklyBudget;
        const cases = await this.caseRepository.getAllWithoutPagination({
            debtor: debtor._id,
        });
        for (const caseTemp of cases) {
            amount += await this.getWeeklyAmount(caseTemp.intervals[0]);
            debt += caseTemp.remaining;
        }
        return amount >= weeklyBudget
            ? {
                status: false,
                commission: 0,
                totalCommission: 0,
            }
            : {
                status: true,
                commission: weeklyBudget - amount,
                totalCommission: parseInt((debt * 0.19).toFixed(2)),
            };
    }
    async getWeeklyAmount(interval) {
        switch (interval.timePeriod.toLowerCase()) {
            case 'custom':
                return interval.amount;
            case 'daily':
                return interval.amount * interval.frequency;
            case 'weekly':
                return interval.amount;
            case 'monthly':
                return parseInt((interval.amount / 4).toFixed(2));
            case 'fortnightly':
                return parseInt((interval.amount / 2).toFixed(2));
            default:
                throw new Error('Invalid time period');
        }
    }
    async checkCasePayment(body) {
        if (body.remaining !== body.totalDebt - body.paidAmount) {
            return [false, constants_util_1.default.Messages.PAYMENT_CALCULATION_ERROR];
        }
        if (body && body.intervals && body.intervals.length) {
            let amount = 0;
            for (const interval of body.intervals) {
                if (!interval.frequency) {
                    amount += interval.amount;
                }
                if (interval.frequency) {
                    // for (let i = 0; i < interval.frequency; i++) {
                    //   amount += interval.amount;
                    // }
                    let multipliedAmount = interval.frequency * interval.amount;
                    amount += multipliedAmount;
                }
            }
            if (amount !== body.remaining) {
                return [false, constants_util_1.default.Messages.PAYMENT_CALCULATION_ERROR];
            }
        }
        return [true, ''];
    }
    async getClientsList(cases) {
        const seenDebtor = new Set();
        const result = [];
        const mappingIndex = {};
        const mappingCreditors = {};
        let seenCreditor = new Set();
        let index = 0;
        for (const tempCase of cases) {
            let debtorId = String(tempCase.debtor._id);
            let creditorId = String(tempCase.creditor);
            if (seenDebtor.has(debtorId)) {
                let index = mappingIndex[debtorId];
                let creditorSet = mappingCreditors[debtorId];
                let resultObj = result[index];
                if (!creditorSet.has(creditorId)) {
                    resultObj.creditors += 1;
                    creditorSet.add(creditorId);
                    mappingCreditors[debtorId] = creditorSet;
                }
                result[index] = {
                    cases: resultObj.cases + 1,
                    creditors: resultObj.creditors,
                    name: resultObj.name,
                    status: resultObj.status,
                    totalDebt: resultObj.totalDebt + tempCase.totalDebt,
                    id: resultObj.id,
                };
            }
            else {
                seenDebtor.add(debtorId);
                seenCreditor.add(creditorId);
                result.push({
                    cases: 1,
                    creditors: 1,
                    name: tempCase.debtor.basicInformation.fullName,
                    status: tempCase.debtor.basicInformation.status,
                    totalDebt: tempCase.totalDebt,
                    id: debtorId,
                });
                mappingIndex[debtorId] = index;
                index += 1;
                mappingCreditors[debtorId] = seenCreditor;
                seenCreditor = new Set();
            }
        }
        return result;
    }
    async getClientDetails(req) {
        const convertedDebtorId = new mongoose_1.default.Types.ObjectId(req.params.id);
        const pipeline = [
            {
                $match: { debtor: convertedDebtorId },
            },
            {
                $lookup: {
                    from: 'debtors',
                    localField: 'debtor',
                    foreignField: '_id',
                    as: 'debtorDetails',
                },
            },
            {
                $unwind: '$debtorDetails',
            },
            {
                $lookup: {
                    from: 'creditors',
                    localField: 'creditor',
                    foreignField: '_id',
                    as: 'creditorDetails',
                },
            },
            {
                $unwind: '$creditorDetails',
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'caseId',
                    as: 'payments',
                },
            },
            {
                $addFields: {
                    lastPayment: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.captured', 'Success'] },
                                },
                            },
                            -1,
                        ],
                    },
                    upcomingPayment: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.authorized', 'Pending'] },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $addFields: {
                    lastPayment: { $ifNull: ['$lastPayment', null] },
                    upcomingPayment: { $ifNull: ['$upcomingPayment', null] },
                },
            },
            {
                $group: {
                    _id: '$debtor',
                    caseHistory: {
                        $push: {
                            _id: '$_id',
                            creditorName: '$creditorDetails.basicInformation.fullName',
                            totalDebt: '$totalDebt',
                            lastPayment: { $ifNull: ['$lastPayment.amount', null] },
                            lastPaymentDate: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: { $ifNull: ['$lastPayment.dueDate', null] },
                                },
                            },
                            upcomingPayment: { $ifNull: ['$upcomingPayment.amount', null] },
                            upcomingPaymentDate: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: { $ifNull: ['$upcomingPayment.dueDate', null] },
                                },
                            },
                            caseOwner: '$caseOwner',
                            outstandingDebt: {
                                $subtract: ['$remaining', { $sum: '$payments.amount' }],
                            },
                        },
                    },
                    debtorDetails: { $first: '$debtorDetails' },
                    failedPayments: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.captured', 'Failed'] },
                                },
                            },
                        },
                    },
                    failedAuthorizations: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.authorized', 'Failed'] },
                                },
                            },
                        },
                    },
                    successfulPayments: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.captured', 'Success'] },
                                },
                            },
                        },
                    },
                    successfulAuthorizations: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.authorized', 'Success'] },
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    caseHistory: 1,
                    debtor: {
                        SSN: '$debtorDetails.basicInformation.SSID',
                        fullName: '$debtorDetails.basicInformation.fullName',
                        companyName: '$debtorDetails.businessInformation.companyName',
                        email: '$debtorDetails.basicInformation.email',
                        status: '$debtorDetails.basicInformation.status',
                        address: '$debtorDetails.basicInformation.address',
                        outstandingDebt: {
                            $sum: '$caseHistory.outstandingDebt',
                        },
                        totalDebt: {
                            $sum: '$caseHistory.totalDebt',
                        },
                    },
                    paymentCounts: {
                        failedPayments: '$failedPayments',
                        failedAuthorizations: '$failedAuthorizations',
                        successfulPayments: '$successfulPayments',
                        successfulAuthorizations: '$successfulAuthorizations',
                    },
                },
            },
        ];
        const results = await this.caseRepository.applyAggregate(pipeline);
        if (results[0]?.caseHistory) {
            results[0].caseHistory = await this.filterCaseHistoryDebtor(results[0]?.caseHistory, req);
        }
        return results.length ? results[0] : null;
    }
    async filterCaseHistoryDebtor(caseHistory, req) {
        // Helper function to apply text search
        const applyTextSearch = (caseObj, text) => {
            const regex = new RegExp(text, 'i');
            return regex.test(caseObj.creditorName) || regex.test(caseObj.caseOwner);
        };
        // Helper function to apply numeric/date filters
        const applyFilters = (caseObj, filters) => {
            if (filters.totalDebt &&
                (caseObj.totalDebt < filters.totalDebt.min ||
                    caseObj.totalDebt > filters.totalDebt.max)) {
                return false;
            }
            if (filters.lastPaymentAmount &&
                (caseObj.lastPayment < filters.lastPaymentAmount.min ||
                    caseObj.lastPayment > filters.lastPaymentAmount.max)) {
                return false;
            }
            if (filters.lastPaymentDate &&
                (new Date(caseObj.lastPaymentDate) <
                    new Date(filters.lastPaymentDate.start) ||
                    new Date(caseObj.lastPaymentDate) >
                        new Date(filters.lastPaymentDate.end))) {
                return false;
            }
            if (filters.upcomingPaymentAmount &&
                (caseObj.upcomingPayment < filters.upcomingPaymentAmount.min ||
                    caseObj.upcomingPayment > filters.upcomingPaymentAmount.max)) {
                return false;
            }
            if (filters.upcomingPaymentDate &&
                (new Date(caseObj.upcomingPaymentDate) <
                    new Date(filters.upcomingPaymentDate.start) ||
                    new Date(caseObj.upcomingPaymentDate) >
                        new Date(filters.upcomingPaymentDate.end))) {
                return false;
            }
            if (filters.outstandingDebt &&
                (caseObj.outstandingDebt < filters.outstandingDebt.min ||
                    caseObj.outstandingDebt > filters.outstandingDebt.max)) {
                return false;
            }
            return true;
        };
        let text = '', filters = {};
        if (req.query.search === 'true') {
            text = req.body.text;
        }
        if (req.query.filter === 'true') {
            filters = req.body.filters;
        }
        // Apply text search and filters
        let filteredCaseHistory = caseHistory.filter(caseObj => {
            const textMatches = !text || applyTextSearch(caseObj, text);
            const filtersMatch = Object.keys(filters).length === 0 || applyFilters(caseObj, filters);
            return textMatches && filtersMatch;
        });
        return filteredCaseHistory;
    }
    async filterAndPaginateCaseHistoryCreditor(caseHistory, req) {
        let page = 1;
        let limit = 10;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        // Helper function to apply text search
        const applyTextSearch = (caseObj, text) => {
            const regex = new RegExp(text, 'i');
            return regex.test(caseObj.debtorName) || regex.test(caseObj.caseOwner);
        };
        // Helper function to apply numeric/date filters
        const applyFilters = (caseObj, filters) => {
            if (filters.totalDebt &&
                (caseObj.totalDebt < filters.totalDebt.min ||
                    caseObj.totalDebt > filters.totalDebt.max)) {
                return false;
            }
            if (filters.lastPaymentAmount &&
                (caseObj.lastPayment < filters.lastPaymentAmount.min ||
                    caseObj.lastPayment > filters.lastPaymentAmount.max)) {
                return false;
            }
            if (filters.lastPaymentDate &&
                (new Date(caseObj.lastPaymentDate) <
                    new Date(filters.lastPaymentDate.start) ||
                    new Date(caseObj.lastPaymentDate) >
                        new Date(filters.lastPaymentDate.end))) {
                return false;
            }
            if (filters.upcomingPaymentAmount &&
                (caseObj.upcomingPayment < filters.upcomingPaymentAmount.min ||
                    caseObj.upcomingPayment > filters.upcomingPaymentAmount.max)) {
                return false;
            }
            if (filters.upcomingPaymentDate &&
                (new Date(caseObj.upcomingPaymentDate) <
                    new Date(filters.upcomingPaymentDate.start) ||
                    new Date(caseObj.upcomingPaymentDate) >
                        new Date(filters.upcomingPaymentDate.end))) {
                return false;
            }
            if (filters.outstandingDebt &&
                (caseObj.outstandingDebt < filters.outstandingDebt.min ||
                    caseObj.outstandingDebt > filters.outstandingDebt.max)) {
                return false;
            }
            return true;
        };
        let text = '', filters = {};
        if (req.query.search === 'true') {
            text = req.body.text;
        }
        if (req.query.filter === 'true') {
            filters = req.body.filters;
        }
        // Apply text search and filters
        let filteredCaseHistory = caseHistory.filter(caseObj => {
            const textMatches = !text || applyTextSearch(caseObj, text);
            const filtersMatch = Object.keys(filters).length === 0 || applyFilters(caseObj, filters);
            return textMatches && filtersMatch;
        });
        // Apply pagination
        const paginatedCaseHistory = filteredCaseHistory.slice((page - 1) * limit, page * limit);
        return paginatedCaseHistory;
    }
    async getCreditorDetails(req) {
        const convertedCreditorId = new mongoose_1.default.Types.ObjectId(req.params.id);
        const pipeline = [
            {
                $match: { creditor: convertedCreditorId },
            },
            {
                $lookup: {
                    from: 'debtors',
                    localField: 'debtor',
                    foreignField: '_id',
                    as: 'debtorDetails',
                },
            },
            {
                $unwind: '$debtorDetails',
            },
            {
                $lookup: {
                    from: 'creditors',
                    localField: 'creditor',
                    foreignField: '_id',
                    as: 'creditorDetails',
                },
            },
            {
                $unwind: '$creditorDetails',
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'caseId',
                    as: 'payments',
                },
            },
            {
                $addFields: {
                    lastPayment: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.captured', 'Success'] },
                                },
                            },
                            -1,
                        ],
                    },
                    upcomingPayment: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.authorized', 'Pending'] },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $addFields: {
                    lastPayment: { $ifNull: ['$lastPayment', null] },
                    upcomingPayment: { $ifNull: ['$upcomingPayment', null] },
                },
            },
            {
                $group: {
                    _id: '$creditor',
                    caseHistory: {
                        $push: {
                            _id: '$_id',
                            debtorName: '$debtorDetails.basicInformation.fullName',
                            totalDebt: '$totalDebt',
                            lastPayment: { $ifNull: ['$lastPayment.amount', null] },
                            lastPaymentDate: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: { $ifNull: ['$lastPayment.dueDate', null] },
                                },
                            },
                            upcomingPayment: { $ifNull: ['$upcomingPayment.amount', null] },
                            upcomingPaymentDate: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: { $ifNull: ['$upcomingPayment.dueDate', null] },
                                },
                            },
                            caseOwner: '$caseOwner',
                            outstandingDebt: {
                                $subtract: ['$remaining', { $sum: '$payments.amount' }],
                            },
                        },
                    },
                    creditorDetails: { $first: '$creditorDetails' },
                    failedPayments: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.captured', 'Failed'] },
                                },
                            },
                        },
                    },
                    failedAuthorizations: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.authorized', 'Failed'] },
                                },
                            },
                        },
                    },
                    successfulPayments: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.captured', 'Success'] },
                                },
                            },
                        },
                    },
                    successfulAuthorizations: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$payments',
                                    as: 'payment',
                                    cond: { $eq: ['$$payment.authorized', 'Success'] },
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    caseHistory: 1,
                    creditor: {
                        fullName: '$creditorDetails.basicInformation.fullName',
                        email: '$creditorDetails.basicInformation.email',
                        phone: '$creditorDetails.basicInformation.phone',
                        outstandingDebt: {
                            $sum: '$caseHistory.outstandingDebt',
                        },
                        totalDebt: {
                            $sum: '$caseHistory.totalDebt',
                        },
                    },
                    paymentCounts: {
                        failedPayments: '$failedPayments',
                        failedAuthorizations: '$failedAuthorizations',
                        successfulPayments: '$successfulPayments',
                        successfulAuthorizations: '$successfulAuthorizations',
                    },
                },
            },
        ];
        const results = await this.caseRepository.applyAggregate(pipeline);
        if (results[0]?.caseHistory) {
            results[0].caseHistory = await this.filterAndPaginateCaseHistoryCreditor(results[0]?.caseHistory, req);
        }
        return results.length ? results[0] : null;
    }
    async getClientDetailsFilters(req) {
        const filterConditions = [];
        if (req.query.filter === 'true') {
            const filters = req.body.filters;
            // Add filters for numeric/date ranges if provided
            if (filters.totalDebt) {
                filterConditions.push({
                    totalDebt: { $gte: filters.totalDebt.min, $lte: filters.totalDebt.max },
                });
            }
            if (filters.lastPaymentAmount) {
                filterConditions.push({
                    lastPayment: {
                        $gte: filters.lastPaymentAmount.min,
                        $lte: filters.lastPaymentAmount.max,
                    },
                });
            }
            if (filters.lastPaymentDate) {
                filterConditions.push({
                    lastPaymentDate: {
                        $gte: filters.lastPaymentDate.start,
                        $lte: filters.lastPaymentDate.end,
                    },
                });
            }
            if (filters.upcomingPaymentAmount) {
                filterConditions.push({
                    upcomingPayment: {
                        $gte: filters.upcomingPaymentAmount.min,
                        $lte: filters.upcomingPaymentAmount.max,
                    },
                });
            }
            if (filters.upcomingPaymentDate) {
                filterConditions.push({
                    upcomingPaymentDate: {
                        $gte: filters.upcomingPaymentDate.start,
                        $lte: filters.upcomingPaymentDate.end,
                    },
                });
            }
            if (filters.outstandingDebt) {
                filterConditions.push({
                    outstandingDebt: {
                        $gte: filters.outstandingDebt.min,
                        $lte: filters.outstandingDebt.max,
                    },
                });
            }
        }
        if (req.query.search === 'true') {
            const text = req.body.text;
            if (text) {
                filterConditions.push({
                    $or: [{ creditorName: { $regex: text } }, { caseOwner: { $regex: text } }],
                });
            }
        }
        return filterConditions;
    }
    async getClientListingPipeline(req) {
        const filters = await this.getClientListingFilters(req);
        const pipeline = [
            {
                $lookup: {
                    from: 'debtors',
                    localField: 'debtor',
                    foreignField: '_id',
                    as: 'debtor',
                },
            },
            {
                $unwind: '$debtor',
            },
            {
                $match: filters[1],
            },
            {
                $group: {
                    _id: { $toString: '$debtor._id' },
                    debtorName: { $first: '$debtor.basicInformation.fullName' },
                    totalCases: { $sum: 1 },
                    totalCreditors: { $addToSet: '$creditor' },
                    totalDebt: { $sum: '$totalDebt' },
                    status: { $first: '$debtor.basicInformation.status' },
                },
            },
            {
                $project: {
                    id: '$_id',
                    _id: 0,
                    debtorName: 1,
                    totalCases: 1,
                    totalCreditors: { $size: '$totalCreditors' }, // Count unique creditors
                    totalDebt: 1,
                    status: 1,
                },
            },
            {
                $match: filters[0],
            },
            {
                $sort: { id: -1 },
            },
        ];
        return pipeline;
    }
    async getClientListingFilters(req) {
        const queryFilter = {};
        const querySearch = {};
        if (req.query.filter === 'true') {
            let filter = req.body.filter;
            if (filter.totalDebt) {
                queryFilter['totalDebt'] = {
                    $gte: filter.totalDebt.min,
                    $lte: filter.totalDebt.max,
                };
            }
            if (filter.totalCases) {
                queryFilter['totalCases'] = {
                    $gte: filter.totalCases.min,
                    $lte: filter.totalCases.max,
                };
            }
            if (filter.totalCreditors) {
                queryFilter['totalCreditors'] = {
                    $gte: filter.totalCreditors.min,
                    $lte: filter.totalCreditors.max,
                };
            }
        }
        if (req.query.search === 'true') {
            querySearch['$or'] = [
                {
                    'debtor.basicInformation.fullName': {
                        $regex: req.body.text,
                        $options: 'i',
                    },
                },
                {
                    'debtor.basicInformation.status': {
                        $regex: req.body.text,
                        $options: 'i',
                    },
                },
            ];
        }
        return [queryFilter, querySearch];
    }
    async getCreditorListingPipeline(req) {
        const filters = await this.getCreditorListingFilters(req);
        const pipeline = [
            {
                $lookup: {
                    from: 'creditors',
                    localField: 'creditor',
                    foreignField: '_id',
                    as: 'creditor',
                },
            },
            {
                $unwind: '$creditor',
            },
            {
                $match: filters[1],
            },
            {
                $group: {
                    _id: { $toString: '$creditor._id' },
                    creditorName: { $first: '$creditor.basicInformation.fullName' },
                    totalCases: { $sum: 1 },
                    totalDebtors: { $addToSet: '$debtor' }, // Collect unique debtors
                    totalDebt: { $sum: '$totalDebt' },
                },
            },
            {
                $project: {
                    id: '$_id',
                    _id: 0,
                    creditorName: 1,
                    totalCases: 1,
                    totalDebtors: { $size: '$totalDebtors' }, // Count unique debtors
                    totalDebt: 1,
                },
            },
            {
                $match: filters[0],
            },
            {
                $sort: { id: -1 },
            },
        ];
        return pipeline;
    }
    async getCreditorListingFilters(req) {
        const queryFilter = {};
        const querySearch = {};
        if (req.query.filter === 'true') {
            let filter = req.body.filter;
            if (filter.totalDebt) {
                queryFilter['totalDebt'] = {
                    $gte: filter.totalDebt.min,
                    $lte: filter.totalDebt.max,
                };
            }
            if (filter.totalCases) {
                queryFilter['totalCases'] = {
                    $gte: filter.totalCases.min,
                    $lte: filter.totalCases.max,
                };
            }
            if (filter.totalCreditors) {
                queryFilter['totalDebtors'] = {
                    $gte: filter.totalDebtors.min,
                    $lte: filter.totalDebtors.max,
                };
            }
        }
        if (req.query.search === 'true') {
            querySearch['creditor.basicInformation.fullName'] = {
                $regex: req.body.text,
                $options: 'i',
            };
        }
        return [queryFilter, querySearch];
    }
    async updateContacts(data) {
        for (const contact of data) {
            await this.contactRepository.updateById(contact._id, {
                ...contact,
            });
        }
    }
    async updateDebtor(data) {
        return await this.debtRepository.updateById(data._id, { ...data });
    }
    async updateCreditor(data) {
        return await this.creditorRepository.updateById(data._id, {
            ...data,
        });
    }
}
exports.default = new CaseUtil();
//# sourceMappingURL=case.util.js.map