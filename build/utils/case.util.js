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
const payment_util_1 = __importDefault(require("./payment.util"));
class CaseUtil {
    constructor() {
        this.contactRepository = new contact_repository_1.ContactRepository();
        this.debtRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.debtorService = new debtor_service_1.default();
        this.creditorService = new creditor_service_1.default();
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
                        payment.dueDate = await this.getDatePayment(interval.startDate, interval.timePeriod, i);
                    }
                    tempPayment = await this.populatePayment(data._id, payment, interval, i);
                    paymentsArray.push(tempPayment);
                }
            }
        }
        await this.paymentRepository.createMany(paymentsArray);
    }
    async getDatePayment(date, timePeriod, number) {
        const currentDate = new Date(date);
        switch (timePeriod.toLowerCase()) {
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
        payment.amount = interval.amount;
        payment.frequency = frequency;
        payment.caseId = caseId;
        payment.intervalId = String(interval._id);
        return { ...payment };
    }
    async getCaseCode() {
        const cases = await this.caseRepository.getAll({}, {}, undefined);
        if (!cases.length)
            return 'CASE-001';
        let caseCode = cases[cases.length - 1].caseCode;
        return ('CASE-' +
            (parseInt(caseCode.split('-')[1]) + 1).toString().padStart(3, '0'));
    }
    async getAllCreditorsOfDebtor(debtor) {
        const cases = await this.caseRepository.getAll({ debtor: debtor._id }, 'totalDebt caseCode status', undefined, undefined, { path: 'creditor', select: ['basicInformation.fullName'] });
        const tempCases = cases;
        return tempCases.map(obj => ({
            totalDebt: obj.totalDebt,
            caseCode: obj.caseCode,
            status: obj.status,
            name: obj.creditor.basicInformation.fullName,
        }));
    }
    async createCase(body, role, email) {
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
        if (!getDebtor) {
            contactIds = await this.createContacts(body.debtor.contacts);
            const debtorData = {
                ...body.debtor,
                contacts: contactIds,
            };
            debtor = await this.createDebtor(debtorData);
        }
        if (!getCreditor) {
            contactIds = await this.createContacts(body.creditor.contacts);
            const creditorData = {
                ...body.creditor,
                contacts: contactIds,
            };
            creditor = await this.createCreditor(creditorData);
        }
        if (getDebtor)
            debtor = getDebtor;
        if (getCreditor)
            creditor = getCreditor;
        body.debtor = debtor?._id;
        body.creditor = creditor?._id;
        const newCase = new case_repomodel_1.Case();
        newCase.caseOwner = role;
        newCase.createdBy = email;
        newCase.caseCode = await this.getCaseCode();
        const validatedCase = dataCopier_util_1.DataCopier.copy(newCase, body);
        const caseCreated = await this.caseRepository.create(validatedCase);
        await this.createPayment(caseCreated);
        return caseCreated;
    }
    async checkCasePayment(body) {
        if (body.remaining !== body.totalDebt - body.paidAmount) {
            return [false, constants_util_1.default.Messages.PAYMENT_CALCULATION_ERROR];
        }
        let amount = 0;
        for (const interval of body.intervals) {
            if (!interval.frequency) {
                amount += interval.amount;
            }
            if (interval.frequency != 0) {
                for (let i = 0; i < interval.frequency; i++) {
                    amount += interval.amount;
                }
            }
        }
        if (amount !== body.remaining) {
            return [false, constants_util_1.default.Messages.PAYMENT_CALCULATION_ERROR];
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
                console.log(tempCase, 'tempcaseeee');
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
    async getClientDetails(cases) {
        const caseIds = cases.map((tempCase) => {
            return String(tempCase._id);
        });
        const payments = await this.paymentRepository.getAll({
            caseId: caseIds,
        });
        const filteredPayments = await payment_util_1.default.getFilteredPaymentsObj(payments);
        const resultObj = {};
        const result = [];
        let caseIndex = 0, bin = 0;
        let objectCreated = false;
        while (true) {
            if (bin === filteredPayments.upcomingPayments.length &&
                caseIndex === caseIds.length) {
                break;
            }
            if (caseIds[caseIndex] ===
                String(filteredPayments.upcomingPayments[bin]?.caseId)) {
                if (!objectCreated) {
                    resultObj['creditor'] =
                        cases[caseIndex].creditor.basicInformation.fullName;
                    resultObj['totalDebt'] = cases[caseIndex].totalDebt;
                    resultObj['upcomingDebt'] =
                        filteredPayments.upcomingPayments[bin].amount;
                    resultObj['upcomingAuthDate'] = new Date(filteredPayments.upcomingPayments[bin].dueDate)
                        .toISOString()
                        .split('T')[0];
                    resultObj['caseOwner'] = cases[caseIndex].caseOwner;
                    result.push(resultObj);
                    objectCreated = true;
                }
                bin += 1;
            }
            else {
                if (!objectCreated) {
                    resultObj['creditor'] =
                        cases[caseIndex].creditor.basicInformation.fullName;
                    resultObj['totalDebt'] = cases[caseIndex].totalDebt;
                    resultObj['upcomingDebt'] = 0;
                    resultObj['upcomingAuthDate'] = '-';
                    resultObj['caseOwner'] = cases[caseIndex].caseOwner;
                    result.push(resultObj);
                }
                caseIndex += 1;
                objectCreated = false;
            }
        }
        bin = 0;
        caseIndex = 0;
        let findSuccess = false;
        let finalResult = [];
        while (true) {
            if (bin === filteredPayments.successPayments.length &&
                caseIndex === caseIds.length) {
                break;
            }
            if (caseIds[caseIndex] ===
                String(filteredPayments.successPayments[bin]?.caseId)) {
                bin += 1;
                findSuccess = true;
            }
            else {
                if (findSuccess) {
                    let temp = { ...result[caseIndex] };
                    temp['lastPaymentDate'] = new Date(filteredPayments.successPayments[bin - 1].dueDate)
                        .toISOString()
                        .split('T')[0];
                    temp['lastPayment'] =
                        filteredPayments.successPayments[bin - 1].amount;
                    finalResult.push(temp);
                }
                if (!findSuccess) {
                    let temp = { ...result[caseIndex] };
                    temp['lastPaymentDate'] = '-';
                    temp['lastPayment'] = 0;
                    finalResult.push(temp);
                }
                caseIndex += 1;
                findSuccess = false;
            }
        }
        const countPayments = {
            failedAuthorizations: filteredPayments.failedAuthorizations.length,
            failedPayments: filteredPayments.failedPayments.length,
            successAuthorizations: filteredPayments.successAuthorizations.length,
            successPayments: filteredPayments.successPayments.length,
        };
        return { columns: finalResult, paymentsCount: countPayments };
    }
    async getClientListingPipeline(req) {
        let page = 1;
        let limit = 10;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        const filters = await this.getClientListingFilters(req);
        console.log(filters);
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
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            },
        ];
        console.log(pipeline);
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
                { 'debtor.basicInformation.fullName': req.body.text },
                { 'debtor.basicInformation.status': req.body.text },
            ];
        }
        return [queryFilter, querySearch];
    }
}
exports.default = new CaseUtil();
//# sourceMappingURL=case.util.js.map