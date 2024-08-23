"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
const targetCF_repository_1 = require("../repository/targetCustomFields/targetCF.repository");
const payment_repository_1 = require("../repository/payment/payment.repository");
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const creditor_repository_1 = require("../repository/creditor/creditor.repository");
const chatSummary_repomodel_1 = require("../../database/repomodels/chatSummary.repomodel");
const chatSummary_repository_1 = require("../repository/chatSummary/chatSummary.repository");
const user_repository_1 = require("../repository/user/user.repository");
const common_util_1 = __importDefault(require("../../utils/common.util"));
const strategy_repository_1 = require("../repository/strategy/strategy.repository");
const creditor_util_1 = __importDefault(require("../../utils/creditor.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
class CaseService {
    constructor() {
        this.createCase = async (req) => {
            const reqTemp = req;
            if (req.query.bulk === 'true') {
                const casesArray = [];
                for (const tempCase of req.body.cases) {
                    const checkCasePayment = await case_util_1.default.checkCasePayment(tempCase);
                    if (!checkCasePayment[0])
                        return checkCasePayment;
                    const result = await case_util_1.default.createCase(tempCase, reqTemp.role, reqTemp.email);
                    if (result[0]) {
                        casesArray.push(result[1]);
                    }
                }
                if (!casesArray.length)
                    return [false, constants_util_1.default.failureAddMessage('cases')];
                return [true, casesArray];
            }
            const checkCasePayment = await case_util_1.default.checkCasePayment(req.body);
            if (!checkCasePayment[0])
                return checkCasePayment;
            const result = await case_util_1.default.createCase(req.body, reqTemp.name, reqTemp.id);
            if (!result[0])
                return [false, result[1]];
            return [true, result[1]];
        };
        this.getAllCases = async (req) => {
            let cases = await this.caseRepository.getAll({ isDeleted: false }, undefined, undefined, undefined, undefined, undefined, Number(req.query.page), Number(req.query.limit));
            if (!cases.length) {
                return [false, constants_util_1.default.notFoundMessage('Cases')];
            }
            // for (let temp of cases) {
            //   for (let doc of temp.documents) {
            //     const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
            //     doc.url = url;
            //   }
            // }
            return [true, cases];
        };
        this.getCaseById = async (req) => {
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'creditor' }, { path: 'debtor' }]);
            if (!findCase) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            for (let doc of findCase.debtor.documents) {
                const url = await this.uploadUtil.getS3FileSignedUrl(doc.key
                //'application/pdf'
                );
                doc.url = url;
            }
            const creditors = await case_util_1.default.getAllCreditorsOfDebtor(findCase.debtor);
            const uniqueResult = Array.from(new Map(creditors.map(creditor => [creditor.creditorId, creditor])).values());
            const temp = await this.targetCFRepository.getOne({
                target: 'case',
                caseId: req.params.id,
            });
            const updateNotesForm = findCase.notes.length !== 0
                ? await Promise.all(findCase.notes.map(async (note) => {
                    const userName = await this.userRepository.getById(note.userId);
                    return {
                        ...note,
                        userName: userName?.name ?? 'Unknown User', // Add a default name if user is not found
                    };
                }))
                : [];
            const tempCase = findCase;
            tempCase['creditors'] = uniqueResult;
            tempCase['customFields'] = temp ? temp.customFields : [];
            tempCase['notes'] = updateNotesForm ?? [];
            return [true, tempCase];
        };
        this.updateCase = async (req) => {
            let reqTemp = req;
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            if (!findCase)
                return [false, constants_util_1.default.notFoundMessage('case')];
            if (req.body.creditor) {
                const getCreditor = await this.creditorRepository.getById(req.body.creditor._id);
                if (!getCreditor) {
                    return [false, constants_util_1.default.notFoundMessage('creditor')];
                }
                if (req.body.creditor.businessInformation) {
                    const alreadyPresent = await this.creditorRepository.getOne({
                        _id: { $ne: req.body.creditor._id },
                        'businessInformation.companyName': req.body.creditor.businessInformation.companyName,
                    });
                    if (alreadyPresent) {
                        return [
                            false,
                            constants_util_1.default.alreadyExistsMessage(`Creditor with companyName ${req.body.creditor.businessInformation.companyName}`),
                        ];
                    }
                    await this.creditorRepository.updateById(req.body.creditor._id, req.body.creditor);
                }
                await case_util_1.default.updateCreditor(req.body.creditor);
                delete req.body.creditor;
            }
            if (req.body?.intervals &&
                req.body?.intervals.length &&
                findCase.intervals.length) {
                return [false, 'Payment plan already exist!'];
            }
            if (req.body?.intervals?.length && req.body?.commission) {
                // let weeklyBudgetObj: {
                //   status: boolean;
                //   commission: number;
                //   totalCommission: number;
                // };
                // if (req.body.feePayment && req.body.feePayment === 'toPay') {
                //   weeklyBudgetObj = await caseUtil.checkWeeklyBudget(
                //     req.body,
                //     true,
                //     findCase.debtor
                //   );
                // if (!weeklyBudgetObj.status) {
                //   return [
                //     false,
                //     'Weekly budget is not fulfiling the payment plan of debtor',
                //   ];
                // }
                //   await this.debtorRepository.updateById<IDebtor>(findCase.debtor._id, {
                //     totalCommission: weeklyBudgetObj.totalCommission,
                //     weeklyCommission: weeklyBudgetObj.commission,
                //   });
                // }
                await this.debtorRepository.updateById(findCase.debtor._id, {
                    totalCommission: req.body.totalCommission,
                    weeklyCommission: req.body.commission,
                });
            }
            const checkCasePayment = await case_util_1.default.checkCasePayment(req.body);
            if (!checkCasePayment[0])
                return checkCasePayment;
            const caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
            if (!caseUpdated) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            if (req.body.intervals && req.body.intervals.length) {
                case_util_1.default.createPayment(caseUpdated);
            }
            await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, false, true);
            // if (req.body.intervals) {
            //   await caseUtil.createPayment(caseUpdated);
            // }
            const getDebtor = findCase.debtor;
            const allStrategyFalse = await this.caseRepository.updateById(caseUpdated._id, {
                strategyOne_1: false,
                strategyOne_2: false,
                strategyOne_3: false,
                strategyTwo: false,
                strategyThree: false,
            });
            if (allStrategyFalse) {
                const response = await case_util_1.default.getAllCreditorsOfDebtor(getDebtor);
                const creditors = Array.from(new Map(response.map(creditor => [creditor.creditorId, creditor])).values());
                let extractedFieldsTemp = null;
                if (!getDebtor?.extractedFields && !getDebtor?.extractedFields?.length) {
                    const extractedFields = await case_util_1.default.getExtractionMCA(getDebtor);
                    if (extractedFields) {
                        this.debtorRepository.updateById(getDebtor._id, {
                            extractedFields: extractedFields.extracted_fields,
                        });
                        extractedFieldsTemp = extractedFields.extracted_fields;
                    }
                }
                case_util_1.default.getCreditorNames(getDebtor, getDebtor.extractedFields
                    ? getDebtor.extractedFields
                    : extractedFieldsTemp, String(findCase._id));
                case_util_1.default.getScoresForAllCreditors(caseUpdated, creditors, getDebtor.commissionPercentage);
                case_util_1.default.getSettlementRange(caseUpdated);
                case_util_1.default.getLumpSumAmount(caseUpdated);
                case_util_1.default.getFullProfitSettlement(caseUpdated);
            }
            return [true, caseUpdated];
        };
        this.updateCaseAbout = async (req) => {
            let reqTemp = req;
            let findCase = await this.caseRepository.getById(req.params.id);
            if (!findCase)
                return [false, constants_util_1.default.notFoundMessage('case')];
            const caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
            if (!caseUpdated) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, true, false);
            return [true, caseUpdated];
        };
        // getAIIntegrationData = async (
        //   req: Request
        // ): Promise<[boolean, {} | string]> => {
        //   const caseTemp = await this.caseRepository.getById<ICase>(
        //     req.params.id,
        //     undefined,
        //     undefined,
        //     ['debtor']
        //   );
        //   const response = await caseUtil.getAIWrapperData(req, caseTemp);
        //   return [true, response];
        // };
        this.getSummary = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            const response = await case_util_1.default.getSummary(req, caseTemp);
            const newSummary = new chatSummary_repomodel_1.ChatSummary();
            newSummary.chatId = caseTemp.chatId;
            const validatedSummary = dataCopier_util_1.DataCopier.copy(newSummary, response);
            await this.chatSummaryRepository.create(validatedSummary);
            return response;
        };
        this.getAIToken = async (req) => {
            const response = await case_util_1.default.getAIToken('test', 'test');
            return [true, response];
        };
        this.getCaseSummaries = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, 'chatId', undefined, ['debtor']);
            const response = await this.chatSummaryRepository.getAllWithoutPagination({
                chatId: caseTemp.chatId,
            });
            if (!response.length) {
                return [false, constants_util_1.default.notFoundMessage('Summaries')];
            }
            return [true, response];
        };
        this.getCreditorNames = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            const response = await case_util_1.default.getAllCreditorsOfDebtor(caseTemp.debtor);
            const uniqueResult = Array.from(new Map(response.map(creditor => [creditor.creditorId, creditor])).values());
            return [true, uniqueResult];
        };
        this.getScores = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            let getScores = null;
            if (req.body.creditorNames.length) {
                const cases = await this.caseRepository.getAllWithoutPagination({ creditor: { $in: req.body.creditorNames } }, undefined, undefined, undefined, ['creditor']);
                const creditors = cases.map(obj => ({
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
                }));
                getScores = await case_util_1.default.getScores(caseTemp, creditors, caseTemp.debtor.commissionPercentage);
            }
            return getScores;
        };
        this.getSettlementRange = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            const response = await case_util_1.default.getSettlementRange(caseTemp);
            return [true, response];
        };
        this.getCreditorHistory = async (req) => {
            if (!String(req.query.creditorId)) {
                return [false, 'Creditor id is missing'];
            }
            const response = await case_util_1.default.getCreditorHistory(req);
            return [true, response];
        };
        this.createCreditorsCases = async (req) => {
            const reqTemp = req;
            const checkCasePayment = await case_util_1.default.checkCasePayment(req.body);
            if (!checkCasePayment[0])
                return checkCasePayment;
            const result = await case_util_1.default.createCreditorsCases(req, reqTemp.name, reqTemp.id);
            // if (!result[0]) return result;
            return result;
        };
        this.getScoresSettlementRange = async (req) => {
            if (!req.query.all) {
                return [false, 'Query param missing'];
            }
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            if (!caseTemp)
                return [false, constants_util_1.default.notFoundMessage('case')];
            const debtor = caseTemp.debtor;
            let getScores = null, creditorNames = null;
            let creditors = null;
            let settlementRange = null;
            let hardReload = 'false';
            let data = {};
            if (req.query.hardReload && req.query.hardReload === 'true')
                hardReload = 'true';
            creditors = await case_util_1.default.getAllCreditorsOfDebtor(debtor);
            creditors = await creditor_util_1.default.checkCreditorsMapping(creditors);
            creditors = Array.from(new Map(creditors.map(creditor => [creditor.creditorAccountTitle, creditor])).values());
            const result = await this.strategyRepository.getOne({
                caseId: String(caseTemp._id),
                name: 'strategy_one',
            });
            data['creditors'] = creditors;
            data['debtor'] = debtor;
            if (hardReload !== 'true' &&
                caseTemp.strategyOne_1 &&
                result.data.creditorNames) {
                creditorNames = result.data.creditorNames;
                data['creditorNames'] = creditorNames;
            }
            if (hardReload === 'true') {
                let extractedFieldsTemp = [];
                if (!debtor?.extractedFields?.length) {
                    const extractedFields = await case_util_1.default.getExtractionMCA(debtor);
                    if (extractedFields) {
                        this.debtorRepository.updateById(debtor._id, {
                            extractedFields: extractedFields.extracted_fields,
                        });
                        extractedFieldsTemp = extractedFields.extracted_fields;
                    }
                }
                creditorNames = await case_util_1.default.getCreditorNames(debtor, debtor.extractedFields ? debtor.extractedFields : extractedFieldsTemp, String(caseTemp._id));
                data['creditorNames'] = creditorNames;
                if (typeof creditorNames === 'string') {
                    data['getScores'] = null;
                    data['settlementRange'] = null;
                    return [true, data];
                }
            }
            if (req.query.all === 'true') {
                if (hardReload !== 'true' &&
                    caseTemp.strategyOne_2 &&
                    result.data.getScoresAIForAllCreditors) {
                    getScores = result.data.getScoresAIForAllCreditors;
                    data['getScores'] = getScores;
                }
                else {
                    getScores = await case_util_1.default.getScoresForAllCreditors(caseTemp, creditors, debtor.commissionPercentage);
                    data['getScores'] = getScores;
                    if (typeof getScores === 'string') {
                        data['settlementRange'] = null;
                        return [true, data];
                    }
                }
            }
            else {
                if (req.body.creditorNames.length) {
                    const casesCreditors = await this.caseRepository.getAllWithoutPagination({ creditor: { $in: req.body.creditorNames }, debtor: debtor }, undefined, undefined, undefined, ['creditor']);
                    getScores = await case_util_1.default.getScores(caseTemp, casesCreditors, debtor.commissionPercentage);
                    data['getScores'] = getScores;
                    if (typeof getScores === 'string') {
                        data['settlementRange'] = null;
                        return [true, data];
                    }
                }
            }
            if (hardReload !== 'true' &&
                caseTemp.strategyOne_3 &&
                result.data.settlementRange) {
                settlementRange = result.data.settlementRange;
                data['settlementRange'] = settlementRange;
            }
            else {
                settlementRange = await case_util_1.default.getSettlementRange(caseTemp);
                data['settlementRange'] = settlementRange;
            }
            return [true, data];
        };
        this.addNotes = async (req) => {
            let result;
            const reqTemp = req;
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            if (!findCase) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            if (typeof findCase.notes === 'string') {
                result = await this.caseRepository.updateById(req.params.id, {
                    $set: {
                        notes: [
                            {
                                userId: reqTemp.id,
                                value: req.body.notes,
                                createdAt: common_util_1.default.getCurrentDate(),
                            },
                        ],
                    },
                });
            }
            else
                result = await case_util_1.default.addNotes(req, reqTemp.id);
            if (!result)
                return [false, result];
            await email_util_1.default.sendEmailOrSmsByEvent('case_details_update', result._id, '', reqTemp.id);
            return [true, result];
        };
        this.getScoresSettlementByCommPercentage = async (req) => {
            if (!req.body.commissionPercentage ||
                isNaN(req.body.commissionPercentage)) {
                return [false, 'Invalid commission percentage'];
            }
            const comm = Number(req.body.commissionPercentage);
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            if (!caseTemp)
                return [false, constants_util_1.default.notFoundMessage('case')];
            let getScores = null, creditorNames = null;
            let creditors = null;
            let settlementRange = null;
            let data = {};
            let debtor = caseTemp.debtor;
            creditors = await case_util_1.default.getAllCreditorsOfDebtor(caseTemp.debtor);
            creditors = await creditor_util_1.default.checkCreditorsMapping(creditors);
            creditors = Array.from(new Map(creditors.map(creditor => [creditor.creditorAccountTitle, creditor])).values());
            data['creditors'] = creditors;
            debtor = await this.debtorRepository.updateById(debtor._id, {
                commissionPercentage: comm,
            });
            data['debtor'] = debtor;
            let extractedFieldsTemp = null;
            if (!debtor?.extractedFields && !debtor?.extractedFields?.length) {
                const extractedFields = await case_util_1.default.getExtractionMCA(debtor);
                if (extractedFields) {
                    this.debtorRepository.updateById(debtor._id, {
                        extractedFields: extractedFields.extracted_fields,
                    });
                    extractedFieldsTemp = extractedFields.extracted_fields;
                }
            }
            creditorNames = await case_util_1.default.getCreditorNames(debtor, debtor.extractedFields ? debtor.extractedFields : extractedFieldsTemp, String(caseTemp._id));
            data['creditorNames'] = creditorNames;
            if (typeof creditorNames === 'string') {
                data['getScores'] = null;
                data['settlementRange'] = null;
                return [true, data];
            }
            if (req.query.all === 'true') {
                getScores = await case_util_1.default.getScoresForAllCreditors(caseTemp, creditors, comm);
                data['getScores'] = getScores;
                if (typeof getScores === 'string') {
                    data['settlementRange'] = null;
                    return [true, data];
                }
            }
            else {
                if (req.body.creditorNames.length) {
                    const casesCreditors = await this.caseRepository.getAllWithoutPagination({ creditor: { $in: req.body.creditorNames }, debtor: debtor }, undefined, undefined, undefined, ['creditor']);
                    getScores = await case_util_1.default.getScores(caseTemp, casesCreditors, comm);
                    if (typeof getScores === 'string') {
                        data['settlementRange'] = null;
                        return [true, data];
                    }
                    data['getScores'] = getScores;
                }
            }
            settlementRange = await case_util_1.default.getSettlementRange(caseTemp);
            data['settlementRange'] = settlementRange;
            return [true, data];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.uploadUtil = new upload_util_1.default();
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.chatSummaryRepository = new chatSummary_repository_1.ChatSummaryRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.strategyRepository = new strategy_repository_1.StrategyRepository();
    }
    async deleteCase(req) {
        // const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
        const result = await this.caseRepository.updateById(req.params.id, {
            isDeleted: true,
        });
        await this.paymentRepository.updateMany({ caseId: req.params.id }, { isDeleted: true });
        let weeklyBudgetObj;
        weeklyBudgetObj = await case_util_1.default.getUpdatedCommAndTotalComm(String(result.debtor));
        if (!weeklyBudgetObj.status) {
            return [
                false,
                'Weekly budget is not fulfiling the payment plan of debtor',
            ];
        }
        await this.debtorRepository.updateById(String(result.debtor), {
            totalCommission: weeklyBudgetObj.totalCommission,
            weeklyCommission: weeklyBudgetObj.commission,
        });
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('case')];
        }
        return [true, true];
    }
    async sendCaseEmails(userId, previousCase, updatedCase, caseAbout, caseUpdate) {
        if (caseAbout) {
            if (previousCase.caseOwnerId !== updatedCase.caseOwnerId) {
                await email_util_1.default.sendEmailOrSmsByEvent('case_owner_changed', previousCase._id, '', userId);
            }
            if (previousCase.negotiatorId !== updatedCase.negotiatorId) {
                await email_util_1.default.sendEmailOrSmsByEvent('case_negotiator_changed', previousCase._id, '', userId);
            }
            if (previousCase.managerId !== updatedCase.managerId) {
                await email_util_1.default.sendEmailOrSmsByEvent('case_manager_changed', previousCase._id, '', userId);
            }
        }
        if (caseUpdate) {
            await email_util_1.default.sendEmailOrSmsByEvent('case_details_update', previousCase._id, '', userId);
        }
    }
    async getWeeklyAndTotalCommission(req) {
        const findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
        if (!findCase) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        if (findCase.intervals.length) {
            return [false, 'Payment plan already exist!'];
        }
        findCase.intervals = req.body.intervals;
        let weeklyBudgetObj;
        const debtor = findCase.debtor;
        weeklyBudgetObj = await case_util_1.default.checkWeeklyBudget(findCase, true, debtor);
        if (!weeklyBudgetObj.status) {
            return [
                false,
                'Weekly budget is not fulfiling the payment plan of debtor.Please updated weekly budget',
            ];
        }
        return [
            true,
            {
                commission: weeklyBudgetObj.commission,
                totalCommission: weeklyBudgetObj.totalCommission,
                commissionPercentage: debtor.commissionPercentage,
            },
        ];
    }
    async sendSettlementEmail(req) {
        const { from, sendTo, subject, content, cc } = req.body;
        const buffer = await email_util_1.default.generatePdfFromHtml(content);
        return await email_util_1.default.sendEmail(sendTo, from, subject, content, cc, buffer);
    }
}
exports.default = CaseService;
//# sourceMappingURL=case.service.js.map