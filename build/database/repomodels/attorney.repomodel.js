"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attorney = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Attorney {
    constructor() {
        this.lawfirmId = null;
        this.userId = null;
        this.name = '';
        this.email = '';
        this.phone = '';
        this.address = '';
        this.city = '';
        this.SSN = '';
        this.state = '';
        this.status = '';
        this.isDeleted = false;
        this.attorneyFee = 0;
        this.platform = false;
        this.logTrackingId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Attorney = Attorney;
//# sourceMappingURL=attorney.repomodel.js.map