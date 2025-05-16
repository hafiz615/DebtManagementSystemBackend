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
            // description: '',
            state: '',
            city: '',
            zipCode: '',
            phone: '',
            address: '',
        };
        this.accounts = [];
        // paymentType = '';
        // customerVaultId = '';
        this.createdBy = '';
        this.contacts = Array();
        this.documents = Array();
        this.mcaDocuments = Array();
        this.bankStatementDocuments = Array();
        this.otherDocuments = Array();
        this.lawsuitDocuments = Array();
        this.extractedFields = [];
        this.lawsuitFields = null;
        this.totalCommission = 0;
        this.commissionPaid = 0;
        // weeklyCommission = 0;
        // weeklyCommissionPaid = false;
        // weeklyCommissionDate = '';
        this.commissionPercentage = 19;
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
        // profitMargin = 0;
        this.moneyThumbAppId = 0;
        this.appid = 0;
        this.totalStatements = 0;
        this.percentageChange = false;
        this.percentageChangeDate = '';
        this.userId = '';
        this.platform = false;
        this.trueProfit = 0;
        this.videoUrl = '';
        this.intervals = Array();
        this.isExempt = false;
        this.status = '';
        this.paymentPauseCount = 0;
        this.lastPaymentPauseDate = '';
        this.paymentAmountCount = 0;
        this.lastPaymentAmountDate = '';
        this.additionalCharge = false;
        this.paynoteUserIds = [];
        this.paynoteSourceIds = [];
        this.seamlesschexRountingIds = [];
        this.serviceFee = 0;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Debtor = Debtor;
//# sourceMappingURL=debtor.repomodel.js.map