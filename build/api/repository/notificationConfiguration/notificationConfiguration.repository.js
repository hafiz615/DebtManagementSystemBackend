"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationConfigurationRepository = void 0;
const notificationConfiguration_model_1 = require("../../../database/models/notificationConfiguration.model");
const base_repository_1 = require("../base.repository");
class NotificationConfigurationRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(notificationConfiguration_model_1.NotificationConfiguration);
    }
}
exports.NotificationConfigurationRepository = NotificationConfigurationRepository;
//# sourceMappingURL=notificationConfiguration.repository.js.map