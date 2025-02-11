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
const tasks_repository_1 = require("../repository/tasks/tasks.repository");
const inbox_utils_1 = __importDefault(require("../../utils/inbox.utils"));
const case_repository_1 = require("../repository/case/case.repository");
const common_util_1 = __importDefault(require("../../utils/common.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const uuid_1 = require("uuid");
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
        this.updateDraft = async (req) => {
            const reqTemp = req;
            const draftTemp = await this.inboxRepository.getById(req.params.id);
            if (!draftTemp) {
                return [false, constants_util_2.default.notFoundMessage('Draft')];
            }
            let caseData = null;
            if (req.body.caseId) {
                caseData = await this.caseRepository.getById(req.body.caseId, undefined, undefined, [
                    { path: 'debtor', select: ['businessInformation.companyName'] },
                    { path: 'creditor', select: ['businessInformation.companyName'] },
                ]);
                if (!caseData) {
                    return [false, constants_util_2.default.notFoundMessage('Case')];
                }
            }
            const updatedDraftData = await inbox_utils_1.default.prepareUpdateDraft(draftTemp, req.body, caseData, reqTemp.id, reqTemp?.files?.files || []);
            const updatedDraft = await this.inboxRepository.updateById(req.params.id, { ...updatedDraftData, updatedAt: common_util_1.default.getCurrentDate() });
            if (!updatedDraft) {
                return [false, constants_util_2.default.failureUpdateMessage('Draft')];
            }
            return [true, updatedDraft];
        };
        this.updateDraftSms = async (req) => {
            const reqTemp = req;
            const { sendTo, from, content } = req.body;
            const draftId = req.params.id;
            // Find the draft first
            const existingDraft = await this.inboxRepository.getOne({
                _id: req.params.id,
                isDeleted: false,
            });
            if (!existingDraft) {
                return [false, constants_util_2.default.notFoundMessage('Draft')];
            }
            // Update the draft
            const updatedDraft = await this.inboxRepository.updateById(req.params.id, {
                to: sendTo,
                from: from,
                text: content,
                textAsHtml: content,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, updatedDraft];
        };
        this.inboxStatus = async (req) => {
            const filter = req?.query?.task
                ? { Repository: tasks_repository_1.TasksRepository }
                : { Repository: inbox_repository_1.InboxRepository };
            const repositoryInstance = new filter.Repository();
            const existingInbox = await repositoryInstance.getOne({
                _id: req.params.id,
                isDeleted: false,
            });
            if (!existingInbox) {
                return [false, constants_util_2.default.notFoundMessage('')];
            }
            const updatedInbox = await repositoryInstance.updateById(req.params.id, {
                isComplete: true,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, updatedInbox];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.taskRepository = new tasks_repository_1.TasksRepository();
    }
    async getAllInboxes(req) {
        const reqTemp = req;
        const type = req.query.type;
        const medium = req.query.medium;
        const filters = Object.keys(await inbox_utils_1.default.getAllInboxFilters(req)).length
            ? await inbox_utils_1.default.getAllInboxFilters(req)
            : { userId: reqTemp.id };
        filters['isDeleted'] = { $ne: true };
        filters['isComplete'] = { $ne: true };
        filters['medium'] = medium;
        let inbox = await this.inboxRepository.getAllWithoutPagination(filters, undefined, undefined, { createdAt: -1 }, {
            path: 'previousMessages',
        }, undefined
        // Number(req.query.page),
        // Number(req.query.limit)
        );
        const formattedData = inbox_utils_1.default.formatInboxData(inbox, reqTemp.name, type);
        if (!formattedData) {
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
            if (!caseData) {
                return [false, constants_util_2.default.notFoundMessage('Case')];
            }
        }
        const validateDraft = await inbox_utils_1.default.prepareCreateDraft(req.body, caseData, reqTemp.id, reqTemp?.files?.files || []);
        const result = await this.inboxRepository.create(validateDraft);
        if (!result) {
            return [false, constants_util_2.default.failureAddMessage('draft')];
        }
        return [true, result];
    }
    async createDraft(req) {
        const reqTemp = req;
        const threadId = (0, uuid_1.v4)();
        let caseData = null;
        let { from, sendTo, content } = req.body;
        if (req.body.caseId) {
            caseData = await this.caseRepository.getById(req.body.caseId, undefined, undefined, [
                { path: 'debtor', select: ['businessInformation.companyName'] },
                { path: 'creditor', select: ['businessInformation.companyName'] },
            ]);
            if (!caseData) {
                return [false, constants_util_2.default.notFoundMessage('Case')];
            }
        }
        const smsData = {
            from: from,
            to: sendTo,
            text: content,
            textAsHtml: content,
        };
        email_util_1.default.createNewInbox(smsData, caseData, 'draft', threadId, reqTemp.id, reqTemp.name, null, null, 'SMS');
        return [true, `Draft created successfully`];
    }
}
exports.default = InboxService;
//# sourceMappingURL=inbox.service.js.map