"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Check = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Check {
    constructor() {
        this.checkId = '';
        this.debtorId = '';
        this.number = '';
        this.status = '';
        this.basicVerification = '';
        this.fundsConfirmation = '';
        this.bvReason = '';
        this.fcReason = '';
        this.isDeleted = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Check = Check;
//# sourceMappingURL=check.repomodel.js.map