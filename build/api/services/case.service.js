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
                const url = await this.uploadUtil.getS3FileSignedUrl(doc.key, "application/pdf");
                doc.url = url;
            }
            const creditors = await case_util_1.default.getAllCreditorsOfDebtor(findCase.debtor);
            const uniqueResult = Array.from(new Map(creditors.map(creditor => [creditor.creditorId, creditor])).values());
            const temp = await this.targetCFRepository.getOne({
                target: 'case',
                caseId: req.params.id,
            });
            const tempCase = findCase;
            tempCase['creditors'] = uniqueResult;
            tempCase['customFields'] = temp ? temp.customFields : [];
            return [true, tempCase];
        };
        this.updateCase = async (req) => {
            if (req.body.debtor) {
                await case_util_1.default.updateDebtor(req.body.debtor);
                delete req.body.debtor;
            }
            if (req.body.creditor) {
                await case_util_1.default.updateCreditor(req.body.creditor);
                delete req.body.creditor;
            }
            const caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
            if (req.body.intervals) {
                await case_util_1.default.createPayment(caseUpdated);
            }
            if (!caseUpdated) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            return [true, caseUpdated];
        };
        this.updateCaseAbout = async (req) => {
            const caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
            if (!caseUpdated) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
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
            return [true, response];
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
                getScores = await case_util_1.default.getScores(req, caseTemp, creditors);
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
            if (!result[0])
                return [false, result[1]];
            return [true, result[1]];
        };
        this.getScoresSettlementRange = async (req) => {
            if (!req.query.all) {
                return [false, 'Query param missing'];
            }
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            let getScores = null;
            let creditors = null;
            const response = await case_util_1.default.getAllCreditorsOfDebtor(caseTemp.debtor);
            creditors = Array.from(new Map(response.map(creditor => [creditor.creditorId, creditor])).values());
            if (req.query.all === 'true') {
                getScores = await case_util_1.default.getScoresForAllCreditors(caseTemp, creditors);
            }
            else {
                if (req.body.creditorNames.length) {
                    const casesCreditors = await this.caseRepository.getAllWithoutPagination({ creditor: { $in: req.body.creditorNames }, debtor: caseTemp.debtor }, undefined, undefined, undefined, ['creditor']);
                    getScores = await case_util_1.default.getScores(req, caseTemp, casesCreditors);
                }
            }
            const settlementRange = await case_util_1.default.getSettlementRange(caseTemp);
            return [
                true,
                {
                    getScores: getScores,
                    settlementRange: settlementRange,
                    creditors,
                    debtor: caseTemp.debtor,
                },
            ];
        };
        this.addNotes = async (req) => {
            const reqTemp = req;
            const result = await case_util_1.default.addNotes(req, reqTemp.id);
            if (!result)
                return [false, result];
            return [true, result];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.uploadUtil = new upload_util_1.default();
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.chatSummaryRepository = new chatSummary_repository_1.ChatSummaryRepository();
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
}
exports.default = CaseService;
//# sourceMappingURL=case.service.js.map