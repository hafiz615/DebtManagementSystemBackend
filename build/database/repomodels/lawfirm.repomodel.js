"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lawfirm = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Lawfirm {
    constructor() {
        this.userId = null;
        this.lawfirmCompanyName = '';
        this.email = '';
        this.phone = '';
        this.address = '';
        this.city = '';
        this.state = '';
        this.status = '';
        this.EIN = '';
        this.isDeleted = false;
        this.lawfirmFee = 0;
        this.platform = false;
        this.logTrackingId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Lawfirm = Lawfirm;
//# sourceMappingURL=lawfirm.repomodel.js.map