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
const common_util_1 = __importDefault(require("./common.util"));
const upload_util_1 = __importDefault(require("./upload.util"));
const global_1 = require("../database/repomodels/global");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const dotenv_1 = __importDefault(require("dotenv"));
const form_data_1 = __importDefault(require("form-data"));
const strategy_repository_1 = require("../api/repository/strategy/strategy.repository");
const caseHistory_repository_1 = require("../api/repository/caseHistory/caseHistory.repository");
const justification_repository_1 = require("../api/repository/justification/justification.repository");
const paynote_util_1 = __importDefault(require("./paynote.util"));
dotenv_1.default.config();
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
        this.uploadUtil = new upload_util_1.default();
        this.strategyRepository = new strategy_repository_1.StrategyRepository();
        this.caseHistoryRepository = new caseHistory_repository_1.CaseHistoryRepository();
        this.justificationRepository = new justification_repository_1.JustificationRepository();
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
    async createDebtor(data, createdBy) {
        // let data = req.body as IDebtor;
        // const reqTemp: any = req;
        const newDebtor = new debtor_repomodel_1.Debtor();
        newDebtor.createdBy = createdBy;
        // newDebtor.createdBy = reqTemp.id;
        // if (!data?.basicInformation?.weeklyBudget)
        //   data.basicInformation.weeklyBudget = 1;
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
        // await this.paymentLoggingRepository.createMany<IPaymentLogging>(
        //   paymentsArray
        // );
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
        const cases = await this.getAllCreditorsOfDebtorQuery(String(debtor._id));
        const tempCases = cases;
        return tempCases.map(obj => ({
            totalDebt: obj.totalDebt,
            caseCode: obj.caseCode,
            remaining: obj.remaining,
            status: obj.status,
            name: obj.creditor.basicInformation.fullName,
            caseId: String(obj._id),
            creditorId: String(obj.creditor._id),
            creditorAccountTitle: obj.creditor.accountTitle
                ? obj.creditor.accountTitle
                : '',
            accountTitleMapping: obj.creditor.accountTitleMapping
                ? obj.creditor.accountTitleMapping
                : [],
            contractDetails: obj.contractDetails ? obj.contractDetails : null,
        }));
    }
    async getAllCreditorsOfDebtorQuery(debtorId) {
        const cases = await this.caseRepository.getAllWithoutPagination({ debtor: debtorId, isDeleted: false }, 'totalDebt caseCode status remaining contractDetails', undefined, { _id: -1 }, {
            path: 'creditor',
            select: [
                'basicInformation.fullName',
                'accountTitle',
                'accountTitleMapping',
            ],
        });
        return cases;
    }
    async getAllCreditorsOfDebtorForCase(debtorId, creditorId) {
        const cases = await this.caseRepository.getAllWithoutPagination({ debtor: debtorId, isDeleted: false, creditor: { $ne: creditorId } }, undefined, undefined, { _id: -1 }, {
            path: 'creditor',
        });
        return cases;
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
            debtor = await this.createDebtor(body, '');
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
        newCase.chatId = (0, uuid_1.v4)();
        newCase.caseCode = await this.getCaseCode();
        const validatedCase = dataCopier_util_1.DataCopier.copy(newCase, body);
        const caseCreated = await this.caseRepository.create(validatedCase);
        if (!caseCreated) {
            return [false, constants_util_1.default.failureAddMessage('case')];
        }
        await this.createPayment(caseCreated);
        // if (body.paymentToken && body.paymentType) {
        //   await this.createVault(
        //     body.paymentToken,
        //     String(caseCreated.debtor),
        //     body.paymentType
        //   );
        // }
        // if (body.paymentTokenCreditor && body.paymentTypeCreditor) {
        //   await this.creditorService.createVault(
        //     body.paymentTokenCreditor,
        //     String(caseCreated.creditor),
        //     body.paymentTypeCreditor
        //   );
        // }
        console.log('i am going to call AI');
        const creditorNames = await this.getCreditorNames(debtor, '', '');
        console.log(creditorNames, 'creditonamess');
        const findCreditor = creditorNames.includes(creditor.businessInformation.companyName);
        console.log(findCreditor, 'findCrediotrrr');
        if (findCreditor) {
            await this.creditorRepository.updateById(creditor._id, {
                'businessInformation.accountTitle': creditor.businessInformation.companyName,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        return [true, { caseCreated, findCreditor, creditorNames }];
    }
    async checkWeeklyBudget(body, debtorFound, debtor) {
        let weeklyBudget = 0;
        let debt = 0;
        let amount = 0;
        // if (!debtorFound) {
        //   const interval = body.intervals[0];
        //   weeklyBudget = body.debtor.basicInformation.weeklyBudget;
        //   debt = body.remaining;
        //   amount = await this.getWeeklyAmount(interval);
        //   return amount >= weeklyBudget
        //     ? {
        //         status: false,
        //         commission: 0,
        //         totalCommission: 0,
        //       }
        //     : {
        //         status: true,
        //         commission: weeklyBudget - amount,
        //         totalCommission: parseInt((debt * 0.19).toFixed(2)),
        //       };
        // }
        // let commisionPercentage = body.commisionPercentage
        //   ? body.commisionPercentage / 100
        //   : 0.19;
        let commisionPercentage = debtor.commissionPercentage / 100;
        if (debtorFound && body.intervals) {
            const interval = body.intervals[0];
            debt = body.remaining ?? 0;
            amount = await this.getWeeklyAmount(interval);
        }
        weeklyBudget = debtor.basicInformation.weeklyBudget;
        const cases = await this.caseRepository.getAllWithoutPagination({
            _id: { $ne: body._id },
            debtor: debtor._id,
            isDeleted: false,
        });
        for (const caseTemp of cases) {
            if (caseTemp.intervals.length) {
                amount += await this.getWeeklyAmount(caseTemp.intervals[0]);
                debt += caseTemp.remaining;
            }
        }
        console.log(cases, 'casessss');
        console.log(weeklyBudget, 'weeklyBudget');
        console.log(amount, 'amounttttt');
        console.log(debt, 'debteeee');
        console.log(commisionPercentage);
        return amount >= weeklyBudget
            ? {
                status: false,
                commission: 0,
                totalCommission: 0,
            }
            : {
                status: true,
                commission: weeklyBudget - amount,
                totalCommission: parseInt((debt * commisionPercentage).toFixed(2)),
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
        let isExempt = body?.isExempt ?? true;
        if (body.remaining && body.remaining !== body.totalDebt - body.paidAmount) {
            return [false, constants_util_1.default.Messages.PAYMENT_CALCULATION_ERROR];
        }
        if (body && body.intervals && body.intervals.length && !isExempt) {
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
                return [
                    false,
                    constants_util_1.default.Messages.INTERVALS_PAYMENT_CALCULATION_ERROR,
                ];
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
                $match: { debtor: convertedDebtorId, isDeleted: { $ne: true } },
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
                                    cond: { $eq: ['$$payment.status', 'Success'] },
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
                    failedCaptures: {
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
                                    cond: { $eq: ['$$payment.status', 'Success'] },
                                },
                            },
                        },
                    },
                    successfulCaptures: {
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
                        failedCaptures: '$failedCaptures',
                        successfulCaptures: '$successfulCaptures',
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
                $match: { creditor: convertedCreditorId, isDeleted: { $ne: true } },
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
                                    cond: { $eq: ['$$payment.status', 'Success'] },
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
                    failedCaptures: {
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
                                    cond: { $eq: ['$$payment.status', 'Success'] },
                                },
                            },
                        },
                    },
                    successfulCaptures: {
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
                        failedCaptures: '$failedCaptures',
                        failedAuthorizations: '$failedAuthorizations',
                        successfulPayments: '$successfulPayments',
                        successfulCaptures: '$successfulCaptures',
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
    async getClientListingPipeline(req, keyword) {
        let match = { isDeleted: { $ne: true } };
        let reqTemp = req;
        if (keyword === 'viewClientsForSelf') {
            match['$or'] = [
                { caseOwnerId: reqTemp.id },
                { negotiatorId: reqTemp.id },
                { managerId: reqTemp.id },
            ];
        }
        // const filters = await this.getClientListingFilters(req);
        const pipeline = [
            {
                $match: match, // Filter out isDeleted cases
            },
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
                $group: {
                    _id: { $toString: '$debtor._id' },
                    companyName: { $first: '$debtor.businessInformation.companyName' },
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
                    companyName: 1,
                    totalCases: 1,
                    totalCreditors: { $size: '$totalCreditors' }, // Count unique creditors
                    totalDebt: 1,
                    status: 1,
                },
            },
        ];
        let clientDetails = await this.caseRepository.applyAggregate(pipeline);
        // let allDebtors = [];
        // const clientIds = clientDetails.map(client => {
        //   return client.id;
        // });
        // if (keyword === 'viewClientsForSelf') {
        //   const remainingDebtors =
        //     await this.debtRepository.getAllWithoutPagination<IDebtor>({
        //       _id: {$nin: clientIds},
        //       createdBy: reqTemp.id,
        //     });
        //   console.log(remainingDebtors);
        //   const remainingDebtorsFiltered = remainingDebtors.map(debtor => {
        //     return {
        //       companyName: debtor.businessInformation.companyName,
        //       totalCases: 0,
        //       totalDebt: 0,
        //       status: debtor.basicInformation.status,
        //       id: String(debtor._id),
        //       totalCreditors: 0,
        //     };
        //   });
        //   allDebtors = [...clientDetails, ...remainingDebtorsFiltered];
        // } else {
        //   const remainingDebtors =
        //     await this.debtRepository.getAllWithoutPagination<IDebtor>({
        //       _id: {$nin: clientIds},
        //     });
        //   const remainingDebtorsFiltered = remainingDebtors.map(debtor => {
        //     return {
        //       companyName: debtor.businessInformation.companyName,
        //       totalCases: 0,
        //       totalDebt: 0,
        //       status: debtor.basicInformation.status,
        //       id: String(debtor._id),
        //       totalCreditors: 0,
        //     };
        //   });
        //   allDebtors = [...clientDetails, ...remainingDebtorsFiltered];
        // }
        // if (allDebtors.length) {
        //   allDebtors = await this.filterClientsListing(allDebtors, req);
        // }
        // allDebtors.sort((a, b) => (a.id < b.id ? 1 : -1));
        // return allDebtors.length ? allDebtors : [];
        if (clientDetails.length) {
            clientDetails = await this.filterClientsListing(clientDetails, req);
        }
        clientDetails.sort((a, b) => (a.id < b.id ? 1 : -1));
        return clientDetails.length ? clientDetails : [];
    }
    async filterClientsListing(clients, req) {
        // Helper function to apply text search
        const applyTextSearch = (client, text) => {
            const regex = new RegExp(text, 'i');
            return regex.test(client.companyName) || regex.test(client.status);
        };
        // Helper function to apply numeric/date filters
        const applyFilters = (client, filters) => {
            if (filters.totalDebt &&
                (client.totalDebt < filters.totalDebt.min ||
                    client.totalDebt > filters.totalDebt.max)) {
                return false;
            }
            if (filters.totalCases &&
                (client.totalCases < filters.totalCases.min ||
                    client.totalCases > filters.totalCases.max)) {
                return false;
            }
            if (filters.totalCreditors &&
                (client.totalCreditors < filters.totalCreditors.min ||
                    client.totalCreditors > filters.totalCreditors.max)) {
                return false;
            }
            return true;
        };
        let text = '', filters = {};
        if (req.query.search === 'true') {
            text = req.body.text;
        }
        if (req.query.filter === 'true') {
            filters = req.body.filter;
        }
        console.log(filters);
        // Apply text search and filters
        let filteredCaseHistory = clients.filter(client => {
            const textMatches = !text || applyTextSearch(client, text);
            const filtersMatch = Object.keys(filters).length === 0 || applyFilters(client, filters);
            return textMatches && filtersMatch;
        });
        return filteredCaseHistory;
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
    async getCreditorListingPipeline(req, match) {
        const filters = await this.getCreditorListingFilters(req);
        const pipeline = [
            {
                $match: match, // Filter out isDeleted cases
            },
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
                    companyName: { $first: '$creditor.businessInformation.companyName' },
                    totalCases: { $sum: 1 },
                    totalDebtors: { $addToSet: '$debtor' }, // Collect unique debtors
                    totalDebt: { $sum: '$totalDebt' },
                },
            },
            {
                $project: {
                    id: '$_id',
                    _id: 0,
                    companyName: 1,
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
        data.updatedAt = common_util_1.default.getCurrentDate();
        return await this.debtRepository.updateById(data._id, { ...data });
    }
    async updateCreditor(data) {
        data.updatedAt = common_util_1.default.getCurrentDate();
        return await this.creditorRepository.updateById(data._id, {
            ...data,
        });
    }
    async getUpdatedCommAndTotalComm(debtorId) {
        const debtor = await this.debtRepository.getById(debtorId);
        const weeklyBudget = debtor.basicInformation.weeklyBudget;
        const cases = await this.caseRepository.getAllWithoutPagination({
            debtor: debtor._id,
            isDeleted: false,
        });
        let amount = 0, debt = 0;
        for (const caseTemp of cases) {
            amount += await this.getWeeklyAmount(caseTemp.intervals[0]);
            debt += caseTemp.remaining;
        }
        for (const caseTemp of cases) {
            console.log(caseTemp.intervals);
        }
        console.log(amount, 'amounttt');
        console.log(weeklyBudget, 'weeklyy budget');
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
    async getCreditorNamesAI(documents, token, debtorName, debtorId, extractedFields, caseId) {
        const url = `${process.env.baseUrlAI}get-creditor-names?debtor_name=${debtorName}&debtor_id=${debtorId}`;
        const urls = [];
        try {
            for (let doc of documents) {
                const url = await this.uploadUtil.getS3FileSignedUrl(doc.key, true);
                urls.push(url);
            }
            // Data to be sent in the body of the request
            const data = { bank_statements: urls, extracted_fields: extractedFields };
            console.log('I am in getCreditorNamesAI');
            console.log('URL: ', url);
            console.log('Payload: ', data);
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    accept: 'application/json',
                    token: token,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.data.error && caseId) {
                this.strategyRepository.upsert({ caseId: caseId, name: 'strategy_one' }, {
                    'data.creditorNames': response.data,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                this.caseRepository.updateById(caseId, {
                    strategyOne_1: true,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
            if (response.data.error && caseId) {
                this.caseRepository.updateById(caseId, {
                    strategyOne_1: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
            return response.data.error ? response.data.error : response.data;
        }
        catch (error) {
            console.log(error.message);
            return error.message;
        }
    }
    async getScoresAI(comm, token, caseTemp, creditors) {
        const url = `${process.env.baseUrlAI}get-scores?debtor_id=${String(caseTemp.debtor._id)}&commision_percentage=${comm}`;
        let data = {};
        for (const creditor of creditors) {
            const accountTitles = creditor.creditor.accountTitleMapping
                ? creditor.creditor.accountTitleMapping
                : [];
            const accTitleObj = accountTitles.find(temp => {
                return temp.caseId === String(creditor._id);
            });
            let accountTitle = '';
            accountTitle =
                accTitleObj && accTitleObj?.accountTitle
                    ? accTitleObj.accountTitle
                    : creditor.creditor.accountTitle;
            let weekly_budget = Math.max((creditor.remaining * 0.09) / 4, caseTemp.debtor.basicInformation.weeklyBudget);
            let amount = this.getCleanAmount(creditor?.contractDetails?.loan_amount);
            if (accountTitle) {
                data[`${accountTitle}`] = {
                    total_debt: creditor.totalDebt,
                    remaining_debt: creditor.remaining,
                    weekly_budget: weekly_budget,
                    principle_amount: amount,
                };
            }
        }
        if (!Object.keys(data).length)
            data = [];
        console.log('I am in getScoresAIForSelectedCreditors');
        console.log('URL: ', url);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    accept: 'application/json',
                    token: token,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.error ? response.data.error : response.data;
        }
        catch (error) {
            return error.message;
        }
    }
    getCleanAmount(data) {
        if (!data)
            return 0;
        const cleanedAmount = data.replace(/\$|,/g, '');
        let amount = parseInt(cleanedAmount, 10);
        if (isNaN(amount)) {
            amount = 0;
        }
        return amount;
    }
    async getSettlementRangeAI(caseTemp, token) {
        const url = `${process.env.baseUrlAI}get-settlement-range?debtor_id=${String(caseTemp.debtor._id)}`;
        console.log('I am in getSettlementRangeAI');
        console.log('URL: ', url);
        console.log('Payload: ', 'No payload for this call');
        try {
            const response = await axiosInstanceInterceptor_1.default.post(url, {}, {
                headers: {
                    accept: 'application/json',
                    token: token,
                },
            });
            return response.data.error ? response.data.error : response.data;
        }
        catch (error) {
            return error.message;
        }
    }
    async getCreditorHistoryAI(creditorId, token) {
        const url = `${process.env.baseUrlAI}get-creditor-history?creditor_id=${creditorId}`;
        try {
            const response = await axiosInstanceInterceptor_1.default.post(url, {}, {
                headers: {
                    accept: 'application/json',
                    token: token,
                },
            });
            console.log(response.data, 'historyyyy');
            return response.data.error ? [] : response.data;
        }
        catch (error) {
            return [];
        }
    }
    async getSettlementJustifications(caseTemp, models) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const url = `${process.env.baseUrlAI}get-settlement-justifications?debtor_id=${String(caseTemp.debtor)}&enable_cache=${true}`;
        const data = { LLMs: models };
        try {
            console.log('I am in get-settlement-justifications');
            console.log('URL: ', url);
            console.log('Payload: ', data);
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    accept: 'application/json',
                    token: global_1.AIAuth.auth_token,
                },
            });
            if (response.data && response.data.error) {
                this.caseRepository.updateById(caseTemp._id, {
                    justifications: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                return [false, response.data.error];
            }
            this.strategyRepository.upsert({ caseId: caseTemp._id, name: 'justifications' }, {
                'data.justifications': response.data,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            this.caseRepository.updateById(caseTemp._id, {
                justifications: true,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, response.data];
        }
        catch (error) {
            return [false, error.message];
        }
    }
    async lumpSumJustifications(caseTemp, models) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const url = `${process.env.baseUrlAI}get-lump-sum-justifications?debtor_id=${String(caseTemp.debtor)}&enable_cache=${true}`;
        const data = { LLMs: models };
        try {
            console.log('I am in get-lump-sum-justifications');
            console.log('URL: ', url);
            console.log('Payload: ', data);
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    accept: 'application/json',
                    token: global_1.AIAuth.auth_token,
                },
            });
            if (response.data && response.data.error) {
                this.caseRepository.updateById(caseTemp._id, {
                    lumpSumJustifications: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                return [false, response.data.error];
            }
            this.strategyRepository.upsert({ caseId: caseTemp._id, name: 'lumpSumJustifications' }, {
                'data.justifications': response.data,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            this.caseRepository.updateById(caseTemp._id, {
                lumpSumJustifications: true,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, response.data];
        }
        catch (error) {
            return [false, error.message];
        }
    }
    async fullProfitJustifications(caseTemp, models) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const url = `${process.env.baseUrlAI}get-full-profit-justifications?debtor_id=${String(caseTemp.debtor)}&enable_cache=${true}`;
        const data = { LLMs: models };
        try {
            console.log('I am in get-full-profit-justifications');
            console.log('URL: ', url);
            console.log('Payload: ', data);
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    accept: 'application/json',
                    token: global_1.AIAuth.auth_token,
                },
            });
            if (response.data && response.data.error) {
                this.caseRepository.updateById(caseTemp._id, {
                    fullProfitJustifications: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                return [false, response.data.error];
            }
            this.strategyRepository.upsert({ caseId: caseTemp._id, name: 'fullProfitJustifications' }, {
                'data.justifications': response.data,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            this.caseRepository.updateById(caseTemp._id, {
                fullProfitJustifications: true,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, response.data];
        }
        catch (error) {
            return [false, error.message];
        }
    }
    async getLumpSumAmount(caseTemp) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const url = `${process.env.baseUrlAI}get-lump-sum-amount?debtor_id=${String(caseTemp.debtor)}`;
        try {
            console.log('I am in getLumpSumAmount');
            console.log('URL: ', url);
            console.log('Payload: ', 'No payload for this call');
            const response = await axiosInstanceInterceptor_1.default.post(url, {}, {
                headers: {
                    accept: 'application/json',
                    token: global_1.AIAuth.auth_token,
                },
            });
            if (response.data && response.data.error) {
                this.caseRepository.updateById(caseTemp._id, {
                    strategyTwo: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                return [false, response.data.error];
            }
            this.strategyRepository.upsert({ caseId: caseTemp._id, name: 'strategy_two' }, {
                'data.lumpSumAmount': response.data,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            this.caseRepository.updateById(caseTemp._id, {
                strategyTwo: true,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, response.data];
        }
        catch (error) {
            return [false, error.message];
        }
    }
    async getFullProfitSettlement(caseTemp) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const url = `${process.env.baseUrlAI}get-full-profit-settlement?debtor_id=${String(caseTemp.debtor)}`;
        try {
            console.log('I am in getFullProfitSettlement');
            console.log('URL: ', url);
            console.log('Payload: ', 'No payload for this call');
            const response = await axiosInstanceInterceptor_1.default.post(url, {}, {
                headers: {
                    accept: 'application/json',
                    token: global_1.AIAuth.auth_token,
                },
            });
            if (response.data && response.data.error) {
                this.caseRepository.updateById(caseTemp._id, {
                    strategyThree: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                return [false, response.data.error];
            }
            const thirdStrategy = await this.getSettlementMapping(response.data);
            this.strategyRepository.upsert({ caseId: caseTemp._id, name: 'strategy_three' }, {
                'data.fullProfitSettlement': thirdStrategy,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            this.caseRepository.updateById(caseTemp._id, {
                strategyThree: true,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, response.data];
        }
        catch (error) {
            console.log(error);
            return [false, error.message];
        }
    }
    async getSettlementMapping(data) {
        if (data.settlement_range) {
            data.settlement_range = await this.getSettlementRangeSummery(data.settlement_range);
        }
        if (data.percentage_settlement_over_weekly_true_revenue) {
            data.percentage_settlement_over_weekly_true_revenue =
                await this.getSettlementRangeSummery(data.percentage_settlement_over_weekly_true_revenue);
        }
        if (data.percentage_settlement_over_weekly_budget) {
            data.percentage_settlement_over_weekly_budget =
                await this.getSettlementRangeSummery(data.percentage_settlement_over_weekly_budget);
        }
        if (data.new_default_risk_score) {
            data.new_default_risk_score = await this.riskScoreMapping(data.new_default_risk_score);
        }
        if (data.weeks_till_paid) {
            data.weeks_till_paid = await this.transformData(data.weeks_till_paid);
            const result = await this.getSummaryInverse(data.weeks_till_paid);
            data.weeks_till_paid.Summary = result;
            // getSettlementRange.weeks_till_paid = await this.getSettlementRangeSummery(
            //   getSettlementRange.weeks_till_paid
            // );
        }
        if (data.commission_range) {
            // data.commission_range = await this.getSettlementRangeSummery(
            //   data.commission_range
            // );
            data.commission_range = await this.transformData(data.commission_range);
            const result = await this.getSummaryInverse(data.commission_range);
            data.commission_range.Summary = result;
        }
        if (data.weekly_budget) {
            const sum = await this.sumOfWeeklyBudgetValues(data.weekly_budget);
            data.weekly_budget.Summary = sum;
        }
        return data;
    }
    async sumOfWeeklyBudgetValues(weekly_budget) {
        const total = Object.values(weekly_budget).reduce((sum, value) => sum + value, 0);
        return total;
    }
    async getSummary(req, caseTemp) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const url = `${process.env.baseUrlAI}negotiator?human_input=${req.body.humanInput}&debtor_id=${String(caseTemp.debtor._id)}&chat_id=${caseTemp.chatId}`;
        const data = {
            debtor_budget: caseTemp.debtor.basicInformation.weeklyBudget,
            financial_health_summary: req.body.financialHealthSummary,
        };
        try {
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    accept: 'application/json',
                    token: global_1.AIAuth.auth_token,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.data && response.data.error) {
                return [false, response.data.error];
            }
            return [true, response.data.response];
        }
        catch (error) {
            return [false, error.message];
        }
    }
    async getAIToken(username, partnerToken) {
        const url = `${process.env.baseUrlAI}get-auth-token?username=${username}&partner_token=${partnerToken}`;
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url);
            return response.data.error ? [] : response.data;
        }
        catch (error) {
            return [];
        }
    }
    async getCreditorNames(debtor, extractedFields, caseId = '') {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const creditorNames = await this.getCreditorNamesAI(debtor.documents, global_1.AIAuth.auth_token, debtor.businessInformation.companyName, debtor._id, extractedFields, caseId);
        console.log(creditorNames);
        return creditorNames;
    }
    async getExtractionMCA(debtor) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const extractedFields = await this.getExtractionMCA_AI(debtor.documents, global_1.AIAuth.auth_token);
        return extractedFields;
    }
    async getExtractionMCABuffer(documents) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const extractedFields = await this.getExtractionMCA_AIBuffer(documents, global_1.AIAuth.auth_token);
        return extractedFields;
    }
    async findMCASubStr(str) {
        const regex = /mca/i;
        const match = str.match(regex);
        return match ? true : false;
    }
    async findCsvSubStr(str) {
        const regex = /csv/i;
        const match = str.match(regex);
        return match ? true : false;
    }
    async getExtractionMCA_AI(documents, token) {
        const url = `${process.env.baseUrlAI}extract-fields-multiple-files?enable_cache=true`;
        try {
            const form = new form_data_1.default();
            for (let doc of documents) {
                if (await this.findCsvSubStr(doc.originalFileName)) {
                    continue;
                }
                const contents = await this.uploadUtil.getPdfBytesFromS3(doc.key);
                form.append('MCA_pdf', Buffer.from(contents), {
                    filename: doc.originalFileName,
                    contentType: 'application/pdf',
                });
            }
            form.getLength((err, length) => {
                if (err)
                    return null;
            });
            console.log('I am in getExtractionMCA_AI');
            console.log('URL: ', url);
            console.log('Payload: ', form);
            const response = await axiosInstanceInterceptor_1.default.post(url, form, {
                headers: {
                    accept: 'application/json',
                    token: token,
                    ...form.getHeaders(),
                },
            });
            console.log('Response Data', response.data);
            return response.data.error ? null : response.data;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    async getExtractionMCA_AIBuffer(documents, token) {
        const url = `${process.env.baseUrlAI}extract-fields-multiple-files?enable_cache=true`;
        try {
            const form = new form_data_1.default();
            for (let doc of documents) {
                form.append('MCA_pdf', doc.buffer, {
                    filename: doc.originalname,
                    contentType: 'application/pdf',
                });
            }
            // form.getLength((err, length) => {
            //   if (err) return 'null';
            //   return ''
            // });
            console.log('I am in getExtractionMCA_AIBuffer');
            console.log('URL: ', url);
            console.log('Payload: ', form);
            const response = await axiosInstanceInterceptor_1.default.post(url, form, {
                headers: {
                    accept: 'application/json',
                    token: token,
                    ...form.getHeaders(),
                },
            });
            console.log('Response Data', response.data);
            return response.data.error ? response.data.error : response.data;
        }
        catch (error) {
            console.log(error);
            return error.message;
        }
    }
    async getScores(caseTemp, creditors, comm) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const getScores = await this.getScoresAI(comm, global_1.AIAuth.auth_token, caseTemp, creditors);
        if (typeof getScores !== 'string') {
            const sum = await this.sumOfWeeklyBudgetValues(getScores.Scores['Weekly Budget']);
            getScores.Scores['Weekly Budget'].Summary = sum;
            if (sum > 0) {
                await this.debtRepository.updateById(caseTemp.debtor._id, {
                    'basicInformation.weeklyBudget': sum,
                    weeklyBudgetUpdated: true,
                });
            }
        }
        return getScores;
    }
    async getScoresForAllCreditors(caseTemp, creditors, comm) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const getScores = await this.getScoresAIForAllCreditors(comm, global_1.AIAuth.auth_token, caseTemp, creditors);
        if (typeof getScores !== 'string') {
            const sum = await this.sumOfWeeklyBudgetValues(getScores.Scores['Weekly Budget']);
            getScores.Scores['Weekly Budget'].Summary = sum;
            if (sum > 0) {
                await this.debtRepository.updateById(caseTemp.debtor._id, {
                    'basicInformation.weeklyBudget': sum,
                    weeklyBudgetUpdated: true,
                });
            }
        }
        return getScores;
    }
    async getSettlementRange(caseTemp) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        let getSettlementRange = await this.getSettlementRangeAI(caseTemp, global_1.AIAuth.auth_token);
        getSettlementRange = await this.getSettlementMapping(getSettlementRange);
        // if (getSettlementRange.settlement_range) {
        //   getSettlementRange.settlement_range =
        //     await this.getSettlementRangeSummery(
        //       getSettlementRange.settlement_range
        //     );
        // }
        // if (getSettlementRange.percentage_settlement_over_weekly_true_revenue) {
        //   getSettlementRange.percentage_settlement_over_weekly_true_revenue =
        //     await this.getSettlementRangeSummery(
        //       getSettlementRange.percentage_settlement_over_weekly_true_revenue
        //     );
        // }
        // if (getSettlementRange.percentage_settlement_over_weekly_budget) {
        //   getSettlementRange.percentage_settlement_over_weekly_budget =
        //     await this.getSettlementRangeSummery(
        //       getSettlementRange.percentage_settlement_over_weekly_budget
        //     );
        // }
        // if (getSettlementRange.new_default_risk_score) {
        //   getSettlementRange.new_default_risk_score = await this.riskScoreMapping(
        //     getSettlementRange.new_default_risk_score
        //   );
        // }
        // if (getSettlementRange.weeks_till_paid) {
        //   getSettlementRange.weeks_till_paid = await this.transformData(
        //     getSettlementRange.weeks_till_paid
        //   );
        //   const result = await this.getSummaryWeeksTillPaid(
        //     getSettlementRange.weeks_till_paid
        //   );
        //   getSettlementRange.weeks_till_paid.Summary = result;
        //   // getSettlementRange.weeks_till_paid = await this.getSettlementRangeSummery(
        //   //   getSettlementRange.weeks_till_paid
        //   // );
        // }
        // if (getSettlementRange.commission_range) {
        //   getSettlementRange.commission_range =
        //     await this.getSettlementRangeSummery(
        //       getSettlementRange.commission_range
        //     );
        // }
        if (typeof getSettlementRange !== 'string') {
            this.strategyRepository.upsert({ caseId: caseTemp._id, name: 'strategy_one' }, {
                'data.settlementRange': getSettlementRange,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            this.caseRepository.updateById(caseTemp._id, {
                strategyOne_3: true,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        if (typeof getSettlementRange === 'string') {
            this.caseRepository.updateById(caseTemp._id, {
                strategyOne_3: false,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        return getSettlementRange;
    }
    async riskScoreMapping(data) {
        if (Object.keys(data).length) {
            for (const key of Object.keys(data)) {
                data[key] = {
                    min: Math.min(...data[key]),
                    max: Math.max(...data[key]),
                };
            }
        }
        return data;
    }
    async getCreditorHistory(req) {
        if (!global_1.AIAuth.auth_token ||
            new Date(global_1.AIAuth.expires_in) <= new Date(common_util_1.default.getCurrentDate())) {
            await this.storeAuthToken('test', 'test');
        }
        const getCreditorHistory = await this.getCreditorHistoryAI(req.params.id, global_1.AIAuth.auth_token);
        console.log(getCreditorHistory);
        return getCreditorHistory;
    }
    async getScoresAIForAllCreditors(comm, token, caseTemp, creditors) {
        const url = `${process.env.baseUrlAI}get-scores?debtor_id=${String(caseTemp.debtor._id)}&commision_percentage=${comm}`;
        let data = {};
        for (const creditor of creditors) {
            const accountTitles = creditor.accountTitleMapping
                ? creditor.accountTitleMapping
                : [];
            const accTitleObj = accountTitles.find(temp => {
                return temp.caseId === creditor.caseId;
            });
            let accountTitle = '';
            accountTitle =
                accTitleObj && accTitleObj?.accountTitle
                    ? accTitleObj.accountTitle
                    : creditor.creditorAccountTitle;
            let weekly_budget = Math.max((creditor.remaining * 0.09) / 4, caseTemp.debtor.basicInformation.weeklyBudget);
            let amount = this.getCleanAmount(creditor.contractDetails.loan_amount);
            if (accountTitle) {
                data[`${accountTitle}`] = {
                    total_debt: creditor.totalDebt,
                    remaining_debt: creditor.remaining,
                    weekly_budget: weekly_budget,
                    principle_amount: amount,
                };
            }
        }
        if (!Object.keys(data).length)
            data = [];
        console.log('I am in getScoresAIForAllCreditors');
        console.log('URL: ', url);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    accept: 'application/json',
                    token: token,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.data.error) {
                this.strategyRepository.upsert({ caseId: caseTemp._id, name: 'strategy_one' }, {
                    'data.getScoresAIForAllCreditors': response.data,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                this.caseRepository.updateById(caseTemp._id, {
                    strategyOne_2: true,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
            if (response.data.error) {
                this.caseRepository.updateById(caseTemp._id, {
                    strategyOne_2: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
            return response.data.error ? response.data.error : response.data;
        }
        catch (error) {
            return error.message;
        }
    }
    async storeAuthToken(username, partnerToken) {
        const url = `${process.env.baseUrlAI}get-auth-token?username=${username}&partner_token=${partnerToken}`;
        try {
            const response = await axiosInstanceInterceptor_1.default.get(url);
            if (response && response.data) {
                global_1.AIAuth.auth_token = response.data.auth_token;
                global_1.AIAuth.expires_in = response.data.expires_in;
            }
        }
        catch (error) {
            global_1.AIAuth.auth_token = '';
            global_1.AIAuth.expires_in = common_util_1.default.getCurrentDate();
        }
    }
    async createCreditorsCases(body, name, id, debtorId) {
        let creditor = null;
        let dataArray = body.data;
        const createdCases = [];
        const debtor = await this.debtRepository.getById(debtorId);
        for (const body of dataArray) {
            console.log(body.creditor, 'body.creditor');
            body.creditor.basicInformation.email =
                body.creditor.basicInformation.email.toLowerCase();
            const getCreditor = await this.creditorRepository.getOne({
                'businessInformation.companyName': body.creditor.businessInformation.companyName,
            });
            // if (body?.intervals) {
            //   let weeklyBudgetObj: {
            //     status: boolean;
            //     commission: number;
            //     totalCommission: number;
            //   };
            //   if (body.feePayment && body.feePayment === 'toPay') {
            //     weeklyBudgetObj = await this.checkWeeklyBudget(body, true, debtor);
            //     if (!weeklyBudgetObj.status) {
            //       return [
            //         false,
            //         'Weekly budget is not fulfiling the payment plan of debtor',
            //       ];
            //     }
            //     await this.debtRepository.updateById<IDebtor>(debtor._id, {
            //       totalCommission: weeklyBudgetObj.totalCommission,
            //       weeklyCommission: weeklyBudgetObj.commission,
            //     });
            //   }
            // }
            // if (body.creditor.paymentToken && body.creditor.paymentType) {
            //   const customerVaultResponse = await this.createVault(body.paymentToken);
            //   if (!customerVaultResponse[0]) return customerVaultResponse;
            //   body.creditor.customerVaultId = customerVaultResponse[1];
            // }
            if (!getCreditor) {
                creditor = await this.createCreditor(body.creditor);
                await paynote_util_1.default.createCustomer(creditor);
            }
            if (getCreditor) {
                body.updatedAt = common_util_1.default.getCurrentDate();
                creditor = await this.creditorRepository.updateById(getCreditor._id, body.creditor);
            }
            if (creditor) {
                body.debtor = debtor?._id;
                body.creditor = creditor?._id;
                const newCase = new case_repomodel_1.Case();
                newCase.caseOwner = name;
                newCase.caseOwnerId = id;
                newCase.negotiator = name;
                newCase.negotiatorId = id;
                newCase.manager = name;
                newCase.managerId = id;
                body.notes = body?.notes
                    ? [
                        {
                            userId: id,
                            value: body?.notes,
                            createdAt: common_util_1.default.getCurrentDate(),
                        },
                    ]
                    : [];
                newCase.chatId = (0, uuid_1.v4)();
                newCase.caseCode = await this.getCaseCode();
                const validatedCase = dataCopier_util_1.DataCopier.copy(newCase, body);
                console.log(validatedCase, 'validated caseeee');
                const caseCreated = await this.caseRepository.create(validatedCase);
                // if (!caseCreated) {
                //   return [false, constantsUtil.failureAddMessage('case')];
                // }
                if (caseCreated) {
                    createdCases.push(caseCreated);
                    const accountTitles = creditor.accountTitleMapping;
                    if (creditor.accountTitle) {
                        accountTitles.push({
                            caseId: String(caseCreated._id),
                            accountTitle: creditor.accountTitle,
                        });
                        await this.creditorRepository.updateById(creditor._id, {
                            accountTitleMapping: accountTitles,
                            updatedAt: common_util_1.default.getCurrentDate(),
                        });
                    }
                    await this.addInHistory({
                        Time: new Date(common_util_1.default.getCurrentDate()),
                        Action: 'Case Created',
                        'Created By': name,
                    }, caseCreated._id);
                }
                // if (caseCreated?.intervals && caseCreated?.intervals?.length) {
                //   await this.createPayment(caseCreated);
                // }
            }
        }
        if (!createdCases.length)
            return [false, createdCases];
        return [true, createdCases];
    }
    async createCreditorsCasesFromExtraction(dataArray, name, id, debtorId) {
        let creditor = null;
        const createdCases = [];
        for (const body of dataArray) {
            body.creditor.basicInformation.email =
                body.creditor.basicInformation.email.toLowerCase();
            const getCreditor = await this.creditorRepository.getOne({
                'businessInformation.companyName': body.creditor.businessInformation.companyName,
            });
            if (!getCreditor) {
                creditor = await this.createCreditor(body.creditor);
            }
            if (getCreditor) {
                body.updatedAt = common_util_1.default.getCurrentDate();
                creditor = await this.creditorRepository.updateById(getCreditor._id, body.creditor);
            }
            if (creditor) {
                body.debtor = debtorId;
                body.creditor = creditor?._id;
                const newCase = new case_repomodel_1.Case();
                newCase.caseOwner = name;
                newCase.caseOwnerId = id;
                newCase.negotiator = name;
                newCase.negotiatorId = id;
                newCase.manager = name;
                newCase.managerId = id;
                newCase.chatId = (0, uuid_1.v4)();
                newCase.caseCode = await this.getCaseCode();
                const validatedCase = dataCopier_util_1.DataCopier.copy(newCase, body);
                const caseCreated = await this.caseRepository.create(validatedCase);
                // if (!caseCreated) {
                //   return [false, constantsUtil.failureAddMessage('case')];
                // }
                if (caseCreated) {
                    createdCases.push(caseCreated);
                    const accountTitles = creditor.accountTitleMapping;
                    if (creditor.accountTitle) {
                        accountTitles.push({
                            caseId: String(caseCreated._id),
                            accountTitle: creditor.accountTitle,
                        });
                        await this.creditorRepository.updateById(creditor._id, {
                            accountTitleMapping: accountTitles,
                            updatedAt: common_util_1.default.getCurrentDate(),
                        });
                    }
                    await this.addInHistory({
                        Time: new Date(common_util_1.default.getCurrentDate()),
                        Action: 'Case Created',
                        'Created By': name,
                    }, caseCreated._id);
                }
            }
        }
        if (!createdCases.length)
            return [false, createdCases];
        return [true, createdCases];
    }
    async createVault(paymentToken) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            customer_vault: 'add_customer',
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            payment_token: paymentToken,
        };
        const response = await axiosInstanceInterceptor_1.default.get(url, { params });
        const responseNum = new URLSearchParams(response.data).get('response');
        if (responseNum === '1') {
            const customerVault = new URLSearchParams(response.data).get('customer_vault_id');
            // const debtor = await this.debtorRepository.updateById<IDebtor>(id, {
            //   customerVaultId: customerVault,
            //   paymentType: paymentType,
            // });
            return [true, customerVault];
        }
        return [false, 'Unable to create customer vault'];
    }
    async getSettlementRangeSummery(data) {
        const result = { Summary: {} };
        if (data) {
            for (const key of Object.keys(data)) {
                for (const [recKey, values] of Object.entries(data[key])) {
                    if (Array.isArray(values) && values.length > 0) {
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        if (!result[key]) {
                            result[key] = {};
                        }
                        result[key][recKey] = { min, max };
                        // Initialize the summary if not already done
                        if (!result.Summary[recKey]) {
                            result.Summary[recKey] = { min: 0, max: 0 };
                        }
                        // Accumulate the values for summary
                        result.Summary[recKey].min += min;
                        result.Summary[recKey].max += max;
                    }
                }
            }
        }
        return result;
    }
    async getSummaryInverse(weeksTillPaid) {
        const summary = {};
        if (Object.keys(weeksTillPaid).length) {
            Object.values(weeksTillPaid).forEach(company => {
                for (const key of Object.keys(company)) {
                    if (company[key]) {
                        summary[key] = { min: 0, max: 0 };
                        summary[key].min = Math.max(summary[key].min, company[key].min);
                        summary[key].max = Math.max(summary[key].max, company[key].max);
                    }
                }
                // for (let i = 1; i <= Object.keys(company).length; i++) {
                //   const key = `Weeks remaining based on recommendation ${i}`;
                //   console.log(company[i - 0]);
                //   if (company[key]) {
                //     summary[key].min = Math.max(summary[key].min, company[key][0]);
                //     summary[key].max = Math.max(summary[key].max, company[key][1]);
                //   }
                // }
            });
        }
        return summary;
    }
    async transformData(weeksTillPaid) {
        if (Object.keys(weeksTillPaid).length) {
            Object.values(weeksTillPaid).forEach(company => {
                for (const key of Object.keys(company)) {
                    if (company[key]) {
                        company[key] = {
                            max: Math.min(...company[key]),
                            min: Math.max(...company[key]),
                        };
                    }
                }
            });
        }
        return weeksTillPaid;
    }
    async addNotes(req, id) {
        return await this.caseRepository.updateById(req.params.id, {
            $push: {
                notes: {
                    userId: id,
                    value: req.body.notes,
                    createdAt: common_util_1.default.getCurrentDate(),
                },
            },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
    }
    async addInHistory(history, id) {
        const res = await this.caseHistoryRepository.upsert({ caseId: id }, {
            $push: { caseHistory: { $each: [history], $position: 0 } },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
    }
    async getJustificationModels() {
        const justification = await this.justificationRepository.getOne({});
        console.log(justification, 'justification');
        const defaultModels = ['chatgpt', 'claude', 'gemini', 'llama'];
        if (!justification)
            return defaultModels;
        const arrayModels = Array();
        if (justification.llama)
            arrayModels.push('llama');
        if (justification.chatgpt)
            arrayModels.push('chatgpt');
        if (justification.gemini)
            arrayModels.push('gemini');
        if (justification.claude)
            arrayModels.push('claude');
        return arrayModels.length ? arrayModels : defaultModels;
    }
}
exports.default = new CaseUtil();
//# sourceMappingURL=case.util.js.map