"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("../repository/user/user.repository");
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const notification_repository_1 = require("../repository/notification/notification.repository");
const notificationCount_repository_1 = require("../repository/notificationCount/notificationCount.repository");
// import notificationUtils from '../../utils/notification.utils';
dotenv_1.default.config();
class InboxService {
    constructor() {
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
    }
    async getAllNotifications(req) {
        // const filters = await notificationUtils.getAllnotificationFilters(req);
        let notifications = await this.notificationRepository.getAll(undefined, undefined, undefined, { createdAt: -1 }, undefined, undefined
        // Number(req.query.page),
        // Number(req.query.limit)
        );
        // const formattedData =  inboxUtils.formatInboxData(inbox)
        // const totalCount = await this.inboxRepository.getCount<IInbox>(filters);
        if (!notifications.length) {
            return [false, constants_util_2.default.notFoundMessage('Notification')];
        }
        await this.notificationCountRepository.updateMany({}, { count: 0 });
        return [true, notifications];
        // return [true, {inbox, totalCount}];
    }
    async markAsRead(id) {
        const notification = await this.notificationRepository.getById(id);
        if (!notification)
            return [false, constants_util_1.default.notFoundMessage('notification')];
        const tempNotification = await this.notificationRepository.updateById(id, {
            isRead: true,
        });
        if (!tempNotification) {
            return [false, constants_util_1.default.failureUpdateMessage('notification')];
        }
        return [true, notification];
    }
    async getNotificationCount() {
        const notificationCount = this.notificationCountRepository.getCount();
        if (!notificationCount) {
            return [false, constants_util_1.default.notFoundMessage('notification')];
        }
        return [true, notificationCount];
    }
}
exports.default = InboxService;
//# sourceMappingURL=notification.service.js.map