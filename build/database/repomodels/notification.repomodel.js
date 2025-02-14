"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Notification {
    constructor() {
        this.caseId = '';
        this.inboxId = '';
        this.debtorId = '';
        this.userId = '';
        this.type = '';
        this.text = '';
        this.isLinked = false;
        this.isRead = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Notification = Notification;
//# sourceMappingURL=notification.repomodel.js.map