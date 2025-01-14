"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const draft_repository_1 = require("../repository/draft/draft.repository");
const case_repository_1 = require("../repository/case/case.repository");
const draft_util_1 = __importDefault(require("../../utils/draft.util"));
const common_util_1 = __importDefault(require("../../utils/common.util"));
dotenv_1.default.config();
class DraftService {
    constructor() {
        this.draftRepository = new draft_repository_1.DraftRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getAllDraftMessages(req) {
        const reqTemp = req;
        const filters = (Object.keys(await draft_util_1.default.getAllDraftFilters(req))).length ? await draft_util_1.default.getAllDraftFilters(req) : { userId: reqTemp.id };
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        let draft = await this.draftRepository.getAll(filters, undefined, undefined, { createdAt: -1 }, undefined, undefined, pageLimit.page, pageLimit.limit);
        const formattedData = draft_util_1.default.formatDraftData(draft);
        if (!draft.length) {
            return [false, constants_util_1.default.notFoundMessage('Draft')];
        }
        return [true, formattedData];
    }
    async createEmailDraft(req) {
        const reqTemp = req;
        const caseData = await this.caseRepository.getById(req.params.caseId, undefined, undefined, [
            { path: 'debtor', select: ['businessInformation.companyName'] },
            { path: 'creditor', select: ['businessInformation.companyName'] },
        ]);
        if (!caseData) {
            return [false, constants_util_1.default.notFoundMessage('Case')];
        }
        const validateDraft = draft_util_1.default.createDraft(req.body, caseData, reqTemp.id);
        const result = await this.draftRepository.create(validateDraft);
        if (!result) {
            return [false, constants_util_1.default.failureAddMessage('draft')];
        }
        return [true, result];
    }
}
exports.default = DraftService;
//# sourceMappingURL=draft.service.js.map