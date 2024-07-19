"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debtor = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Debtor {
    constructor() {
        this.basicInformation = {
            fullName: '',
            email: '',
            SSID: '',
            country: '',
            state: '',
            city: '',
            zipCode: '',
            status: '',
            phone: '',
            address: '',
            weeklyBudget: 0,
        };
        this.businessInformation = {
            companyName: '',
            EIN: '',
            businessCategory: '',
            description: '',
            country: '',
            state: '',
            city: '',
            zipCode: '',
            phone: '',
            address: '',
        };
        this.paymentType = '';
        this.customerVaultId = '';
        this.contacts = Array();
        this.documents = Array();
        this.totalCommission = 0;
        this.commissionPaid = 0;
        this.weeklyCommission = 0;
        this.weeklyCommissionPaid = false;
        this.weeklyCommissionDate = '';
        this.commissionPaymentId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Debtor = Debtor;
//# sourceMappingURL=debtor.repomodel.js.map