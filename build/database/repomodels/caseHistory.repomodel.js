"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class User {
    constructor() {
        this.caseId = '';
        this.caseHistory = Array();
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.User = User;
//# sourceMappingURL=caseHistory.repomodel.js.map