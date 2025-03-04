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
        this.caseOwnerId = '';
        this.negotiator = '';
        this.negotiatorId = '';
        this.manager = '';
        this.managerId = '';
        this.caseCode = '';
        this.status = '';
        this.debtor = '';
        this.creditor = '';
        this.totalDebt = 0;
        this.lastPaymentDate = '';
        this.feePayment = '';
        this.paidAmount = 0;
        this.remaining = 0;
        this.remainingAmountPaid = 0;
        // documents = Array<{key: ''; originalFileName: ''; url: ''}>();
        this.intervals = Array();
        this.isDeleted = false;
        this.contractDetails = null;
        this.isExempt = false;
        this.confidence = 0;
        this.closeDate = '';
        this.strategyOne_1 = false;
        this.strategyOne_2 = false;
        this.strategyOne_3 = false;
        this.strategyTwo = false;
        this.strategyThree = false;
        this.justifications = false;
        this.lumpSumJustifications = false;
        this.fullProfitJustifications = false;
        this.notes = Array();
        this.chatId = '';
        this.settlementRange = false;
        this.getCaseIdPercentage = false;
        this.platform = false;
        this.creditorPaymentsProceed = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
        this.paymentFrequency = ''; // Payment frequency (text field)
        this.impliedInterestRate = 0; // Implied interest rate per creditor
        this.averageInterestRate = 0; // Average interest rate
        this.lawsuitFile = Array(); // Array of lawsuit file objects
        this.hasLawsuits = false; // Do you have lawsuits?
        this.lawsuitCreditorTags = Array(); // Creditor dropdown tags
        this.dateServed = ''; // Date served
        this.serviceFee = 0;
        this.legalFee = 0;
        this.affiliateLink = '';
        this.affiliateEmail = '';
    }
}
exports.Case = Case;
//# sourceMappingURL=case.repomodel.js.map