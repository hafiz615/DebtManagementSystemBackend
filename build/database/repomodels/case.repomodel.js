"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Case = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Case {
    constructor() {
        this.caseOwner = '';
        this.negotiator = '';
        this.manager = '';
        this.caseCode = '';
        this.createdBy = '';
        this.status = '';
        this.debtor = '';
        this.creditor = '';
        this.totalDebt = 0;
        this.lastPaymentDate = '';
        this.paidAmount = 0;
        this.remaining = 0;
        this.documents = Array();
        this.intervals = Array();
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Case = Case;
//# sourceMappingURL=case.repomodel.js.map