"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Payment {
    constructor() {
        this.caseId = '';
        this.authorized = 'Pending';
        this.captured = 'Pending';
        this.status = 'Upcoming';
        this.amount = 0;
        this.dueDate = '';
        this.frequency = 0;
        this.intervalId = '';
        this.failedReasonAuthorization = '';
        this.failedReasonCaptured = '';
        this.rescheduled = '';
        this.debtorTransId = '';
        this.retriesAuth = 0;
        this.retriesCapture = 0;
        this.commission = 0;
        this.calculatedCommision = 0;
        this.commissionTransId = '';
        this.timePeriod = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Payment = Payment;
//# sourceMappingURL=payment.repomodel.js.map