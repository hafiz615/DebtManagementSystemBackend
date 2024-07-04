"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
const targetCF_repository_1 = require("../repository/targetCustomFields/targetCF.repository");
const payment_repository_1 = require("../repository/payment/payment.repository");
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const creditor_repository_1 = require("../repository/creditor/creditor.repository");
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
            let cases = await this.caseRepository.getAll(undefined, undefined, undefined, undefined, undefined, undefined, Number(req.query.page), Number(req.query.limit));
            if (!cases.length) {
                return [false, constants_util_1.default.notFoundMessage('Cases')];
            }
            for (let temp of cases) {
                for (let doc of temp.documents) {
                    const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
                    doc.url = url;
                }
            }
            return [true, cases];
        };
        this.getCaseById = async (req) => {
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'creditor' }, { path: 'debtor' }]);
            if (!findCase) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            for (let doc of findCase.documents) {
                const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
                doc.url = url;
            }
            const creditors = await case_util_1.default.getAllCreditorsOfDebtor(findCase.debtor);
            const temp = await this.targetCFRepository.getOne({
                target: 'case',
                caseId: req.params.id,
            });
            const tempCase = findCase;
            tempCase['creditors'] = creditors;
            tempCase['customFields'] = temp ? temp.customFields : [];
            return [true, tempCase];
        };
        this.updateCase = async (req) => {
            await case_util_1.default.updateDebtor(req.body.debtor);
            await case_util_1.default.updateCreditor(req.body.creditor);
            delete req.body.debtor;
            delete req.body.creditor;
            const caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
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
        this.caseRepository = new case_repository_1.CaseRepository();
        this.uploadUtil = new upload_util_1.default();
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
    }
    async deleteCase(req) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        await this.paymentRepository.deleteMany({ caseId: req.params.id });
        const caseTemp = await this.caseRepository.getById(req.params.id);
        await this.debtorRepository.delete({ _id: caseTemp.debtor });
        await this.creditorRepository.delete({ _id: caseTemp.creditor });
        const isDeleted = await this.caseRepository.delete({
            _id: req.params.id,
        });
        if (!isDeleted) {
            return [false, constants_util_1.default.failureDeleteMessage('case')];
        }
        return [true, isDeleted];
    }
}
exports.default = CaseService;
//# sourceMappingURL=case.service.js.map