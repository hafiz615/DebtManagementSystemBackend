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
            state: '',
            city: '',
            zipCode: '',
            phone: '',
            address: '',
        };
        this.accounts = Array();
        // paymentType = '';
        // customerVaultId = '';
        this.createdBy = '';
        this.contacts = Array();
        this.documents = Array();
        this.extractedFields = [];
        this.totalCommission = 0;
        this.commissionPaid = 0;
        this.weeklyCommission = 0;
        this.weeklyCommissionPaid = false;
        this.weeklyCommissionDate = '';
        this.commissionPaymentId = '';
        this.commissionPercentage = 20;
        this.bulkUpload = false;
        this.weeklyBudgetUpdated = false;
        this.strategy1MaxProfit = 0;
        this.strategy3MaxProfit = 0;
        this.strategy1BudgetCustom = 0;
        this.strategy3BudgetCustom = 0;
        this.weeklyBudgetKeyStrategy1 = '';
        this.weeklyBudgetKeyStrategy3 = '';
        this.weeklyBudgetStrategy1 = 0;
        this.weeklyBudgetStrategy3 = 0;
        this.profitMargin = 0;
        this.moneyThumbAppId = 0;
        this.appid = 0;
        this.totalStatements = 0;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Debtor = Debtor;
//# sourceMappingURL=debtor.repomodel.js.map