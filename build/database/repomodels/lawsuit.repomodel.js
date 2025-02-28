"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lawsuit = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Lawsuit {
    constructor() {
        this.lawfirmId = null;
        this.attorneyId = null;
        this.debtorId = null;
        this.userId = null;
        this.creditorId = null;
        this.lawsuitStatus = false;
        this.lawsuitPaidAmount = 0;
        this.lawsuitPaidCount = 0;
        this.lawsuitReceiveCount = 0;
        this.lawfirmCompanyName = '';
        this.defendentCompanyName = '';
        this.plantiffCompanyName = '';
        this.logTrackingId = '';
        this.lawsuitDate = common_util_1.default.getCurrentDate();
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Lawsuit = Lawsuit;
//# sourceMappingURL=lawsuit.repomodel.js.map