"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCountRepository = void 0;
const notificationCount_model_1 = require("../../../database/models/notificationCount.model");
const base_repository_1 = require("../base.repository");
class NotificationCountRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(notificationCount_model_1.NotificationCount);
    }
}
exports.NotificationCountRepository = NotificationCountRepository;
//# sourceMappingURL=notificationCount.repository.js.map