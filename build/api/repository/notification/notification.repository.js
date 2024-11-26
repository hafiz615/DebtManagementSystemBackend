"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const notification_model_1 = require("../../../database/models/notification.model");
const base_repository_1 = require("../base.repository");
class NotificationRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(notification_model_1.Notification);
    }
}
exports.NotificationRepository = NotificationRepository;
//# sourceMappingURL=notification.repository.js.map