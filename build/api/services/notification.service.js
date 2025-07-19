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
const common_util_1 = __importDefault(require("../../utils/common.util"));
// import notificationUtils from '../../utils/notification.utils';
dotenv_1.default.config();
class InboxService {
    constructor() {
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
    }
    async getAllNotifications(req) {
        const reqTemp = req;
        const { type, status } = req.body;
        const userId = reqTemp.id;
        let notifications = null;
        let notificationCount = null;
        if (status) {
            const updateField = type === 'EMAIL'
                ? { emailCount: 0 }
                : type === 'SMS'
                    ? { smsCount: 0 }
                    : type === 'TASK'
                        ? { taskCount: 0 }
                        : {};
            if (Object.keys(updateField).length) {
                await this.notificationCountRepository.upsert({ userId }, { $set: updateField });
                return [true, constants_util_1.default.successFoundMessage('Notification')];
            }
        }
        else {
            notifications = await this.notificationRepository.getAll({ type: req.body.type, userId: reqTemp.id }, undefined, undefined, { createdAt: -1 }, ['inboxId'], undefined);
            if (!notifications) {
                return [false, constants_util_2.default.notFoundMessage('Notification')];
            }
            const getNotificationCount = await this.notificationCountRepository.getOne({
                userId,
            });
            const updatedNotificationCount = await common_util_1.default.notificationCount(getNotificationCount, type);
            notificationCount =
                await this.notificationCountRepository.updateByOne({ userId }, { ...updatedNotificationCount });
        }
        return [true, { notifications, notificationCount }];
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
    async getNotificationCount(req) {
        const reqTemp = req;
        const notificationCount = await this.notificationCountRepository.getOne({
            userId: reqTemp.id,
        });
        if (!notificationCount) {
            return [false, constants_util_1.default.notFoundMessage('notification')];
        }
        return [true, notificationCount];
    }
}
exports.default = InboxService;
//# sourceMappingURL=notification.service.js.map