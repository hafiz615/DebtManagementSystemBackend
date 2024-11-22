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
dotenv_1.default.config();
class InboxService {
    constructor() {
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
    async getAllInboxes(req) {
        const filters = await inbox_utils_1.default.getAllInboxFilters(req);
        let inbox = await this.inboxRepository.getAll(filters, undefined, undefined, { createdAt: -1 }, undefined, undefined);
        const formattedData = inbox_utils_1.default.formatInboxData(inbox);
        // const totalCount = await this.inboxRepository.getCount<IInbox>(filters);
        if (!inbox.length) {
            return [false, constants_util_2.default.notFoundMessage('Inbox')];
        }
        return [true, formattedData];
        // return [true, {inbox, totalCount}];
    }
    async markAsRead(id) {
        console.log('id:', id);
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
}
exports.default = InboxService;
//# sourceMappingURL=inbox.service.js.map