"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const case_repomodel_1 = require("../../database/repomodels/case.repomodel");
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
const global_1 = __importDefault(require("../../global"));
class CaseService {
    constructor() {
        this.createCase = async (req) => {
            let contactIds = null;
            let debtor = null;
            let creditor = null;
            if (req.query.debtor === 'null') {
                contactIds = await case_util_1.default.createContacts(req.body.debtor.contacts);
                const debtorData = {
                    ...req.body.debtor,
                    contacts: contactIds,
                };
                debtor = await case_util_1.default.createDebtor(debtorData);
            }
            if (req.query.creditor === 'null') {
                contactIds = await case_util_1.default.createContacts(req.body.creditor.contacts);
                const creditorData = {
                    ...req.body.creditor,
                    contacts: contactIds,
                };
                creditor = await case_util_1.default.createCreditor(creditorData);
            }
            req.body.debtor = debtor ? debtor._id : req.query.debtor;
            req.body.creditor = creditor ? creditor._id : req.query.creditor;
            const newCase = new case_repomodel_1.Case();
            newCase.caseOwner = global_1.default.role;
            newCase.createdBy = global_1.default.email;
            newCase.caseCode = await case_util_1.default.getCaseCode();
            const validatedCase = dataCopier_util_1.DataCopier.copy(newCase, req.body);
            const caseCreated = await this.caseRepository.create(validatedCase);
            await case_util_1.default.createPayment(caseCreated);
            return [true, caseCreated];
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
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, [
                { path: 'creditor', populate: 'contacts' },
                { path: 'debtor', populate: 'contacts' },
            ]);
            if (!findCase) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            for (let doc of findCase.documents) {
                const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
                doc.url = url;
            }
            const creditors = await case_util_1.default.getAllCreditorsOfDebtor(findCase.debtor);
            const tempCase = findCase;
            tempCase['creditors'] = creditors;
            return [true, tempCase];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.uploadUtil = new upload_util_1.default();
    }
}
exports.default = CaseService;
//# sourceMappingURL=case.service.js.map