"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCount = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class NotificationCount {
    constructor() {
        this.count = 0;
        this.userId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.NotificationCount = NotificationCount;
//# sourceMappingURL=notificationCount.repomodel.js.map