"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("../repository/user/user.repository");
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const inbox_repository_1 = require("../repository/inbox/inbox.repository");
const inbox_utils_1 = __importDefault(require("../../utils/inbox.utils"));
const case_repository_1 = require("../repository/case/case.repository");
dotenv_1.default.config();
class InboxService {
    constructor() {
        this.deleteDraftEmail = async (req) => {
            let draftTemp = await this.inboxRepository.getById(req.params.id);
            if (!draftTemp) {
                return [false, constants_util_2.default.notFoundMessage('Draft')];
            }
            const updateDraft = await this.inboxRepository.updateById(req.params.id, { isDeleted: true });
            if (!updateDraft || !updateDraft.isDeleted) {
                return [false, constants_util_2.default.failureDeleteMessage('Draft')];
            }
            return [true, constants_util_2.default.successDeleteMessage('Draft')];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
    async getAllInboxes(req) {
        const reqTemp = req;
        const type = req.query.type;
        const filters = Object.keys(await inbox_utils_1.default.getAllInboxFilters(req)).length
            ? await inbox_utils_1.default.getAllInboxFilters(req)
            : { userId: reqTemp.id };
        filters['isDeleted'] = { $ne: true };
        let inbox = await this.inboxRepository.getAllWithoutPagination(filters, undefined, undefined, { createdAt: -1 }, undefined, undefined
        // Number(req.query.page),
        // Number(req.query.limit)
        );
        const formattedData = inbox_utils_1.default.formatInboxData(inbox, reqTemp.name, type);
        if (!inbox.length) {
            return [false, constants_util_2.default.notFoundMessage('Inbox')];
        }
        return [true, formattedData];
        // return [true, {inbox, totalCount}];
    }
    async markAsRead(id) {
        const inboxMessage = await this.inboxRepository.getById(id);
        if (!inboxMessage)
            return [false, constants_util_1.default.notFoundMessage('email')];
        const inboxTemp = await this.inboxRepository.updateById(id, {
            isRead: true,
        });
        if (!inboxTemp) {
            return [false, constants_util_1.default.failureUpdateMessage('email')];
        }
        return [true, inboxTemp];
    }
    async createEmailDraft(req) {
        const reqTemp = req;
        let caseData = null;
        if (req.body.caseId) {
            caseData = await this.caseRepository.getById(req.body.caseId, undefined, undefined, [
                { path: 'debtor', select: ['businessInformation.companyName'] },
                { path: 'creditor', select: ['businessInformation.companyName'] },
            ]);
            console.log('case data', caseData);
            if (!caseData) {
                return [false, constants_util_2.default.notFoundMessage('Case')];
            }
        }
        const validateDraft = await inbox_utils_1.default.createDraft(req.body, caseData, reqTemp.id, reqTemp?.files?.files || []);
        const result = await this.inboxRepository.create(validateDraft);
        if (!result) {
            return [false, constants_util_2.default.failureAddMessage('draft')];
        }
        return [true, result];
    }
}
exports.default = InboxService;
//# sourceMappingURL=inbox.service.js.map