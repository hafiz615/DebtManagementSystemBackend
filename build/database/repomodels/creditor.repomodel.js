"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Creditor = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Creditor {
    constructor() {
        this.basicInformation = {
            fullName: '',
            email: '',
            phone: '',
        };
        this.businessInformation = {
            companyName: '',
            businessCategory: '',
        };
        this.notes = '';
        this.lastFundedDate = '';
        this.historicalRange = {
            minimum: 0,
            maximum: 0,
        };
        // creditorSecurityKey = '';
        this.paynoteUserId = '';
        this.paynoteSourceId = '';
        this.accountTitle = '';
        this.accountTitleMapping = Array();
        // paymentType = '';
        // customerVaultId = '';
        this.contacts = Array();
        this.aggression = 0;
        this.platform = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Creditor = Creditor;
//# sourceMappingURL=creditor.repomodel.js.map