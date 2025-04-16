"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Case = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const uuid_1 = require("uuid");
const common_util_1 = __importDefault(require("../../utils/common.util"));
const caseModel = new mongoose_1.Schema({
    debtor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Debtors',
    },
    creditor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Creditors',
    },
    totalDebt: {
        type: Number,
    },
    lastPaymentDate: {
        type: Date,
    },
    paidAmount: {
        type: Number,
    },
    status: {
        type: String,
    },
    caseOwner: {
        type: String,
    },
    caseOwnerId: {
        type: String,
    },
    negotiator: {
        type: String,
    },
    negotiatorId: {
        type: String,
    },
    manager: {
        type: String,
    },
    managerId: {
        type: String,
    },
    caseCode: {
        type: String,
    },
    remaining: {
        type: Number,
    },
    remainingAmountPaid: {
        type: Number,
    },
    intervals: {
        type: [
            {
                amount: { type: Number, required: true },
                startDate: { type: Date, required: true },
                frequency: { type: Number, default: 0 },
                timePeriod: { type: String, required: true },
            },
        ],
    },
    contractDetails: {
        type: {},
    },
    feePayment: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
    },
    confidence: {
        type: Number,
    },
    closeDate: {
        type: Date,
    },
    notes: {
        type: (Array),
    },
    chatId: {
        type: String,
    },
    isExempt: {
        type: Boolean,
    },
    strategyOne_1: {
        type: Boolean,
    },
    strategyOne_2: {
        type: Boolean,
    },
    strategyOne_3: {
        type: Boolean,
    },
    strategyTwo: {
        type: Boolean,
    },
    strategyThree: {
        type: Boolean,
    },
    justifications: {
        type: Boolean,
    },
    lumpSumJustifications: {
        type: Boolean,
    },
    fullProfitJustifications: {
        type: Boolean,
    },
    logTrackingId: {
        type: String,
    },
    settlementRange: {
        type: Boolean,
    },
    getCaseIdPercentage: {
        type: Boolean,
    },
    platform: {
        type: Boolean,
    },
    creditorPaymentsProceed: {
        type: Boolean,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
    // Interest Rate Fields
    paymentFrequency: {
        type: String, // Text field for frequency
    },
    impliedInterestRate: {
        type: Number, // Implied Interest rate per creditor
    },
    averageInterestRate: {
        type: Number, // Average interest rate
    },
    // Lawsuit Fields
    lawsuitFile: {
        type: (Array),
    },
    hasLawsuits: {
        type: Boolean, // Do you have lawsuits?
    },
    lawsuitCreditorTags: {
        type: (Array), // Creditor dropdown tags
    },
    dateServed: {
        type: Date,
    },
    serviceFee: {
        type: Number,
    },
    legalFee: {
        type: Number,
    },
    affiliateLink: {
        type: String,
    },
    affiliateEmail: {
        type: String,
    },
    lawsuitExist: {
        type: Boolean,
    },
    lawfirmId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Lawfirms',
    },
    dummyLawsuitExist: {
        type: Boolean,
    },
});
caseModel.pre('save', async function (next) {
    this.logTrackingId = (0, uuid_1.v4)();
    next();
});
const logUpdate = async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate();
    // Retrieve the document before update
    const previousDoc = await this.model.findOne(query);
    this.previousDoc = previousDoc;
    next();
};
const logUpdatePost = async function (doc) {
    let traceId = '', ip = '', userId = '', url = '', method = '';
    const store = localStorage_util_1.default.getStore();
    if (store) {
        if (store.get('traceId'))
            traceId = store.get('traceId');
        if (store.get('ip'))
            ip = store.get('ip');
        if (store.get('userId'))
            userId = store.get('userId');
        if (store.get('url'))
            url = store.get('url');
        if (store.get('method'))
            method = store.get('method');
    }
    const previousDoc = this.previousDoc;
    const logEntry = new updateLogs_model_1.default({
        traceId,
        previousData: previousDoc,
        currentData: doc,
        model: this.model.modelName,
        logTrackingId: previousDoc?.logTrackingId ?? '',
        ip,
        userId,
        url,
        method,
        createdAt: common_util_1.default.getCurrentDate(),
    });
    logEntry.save().catch(err => {
        console.error('Error saving log entry', err);
    });
};
caseModel.pre('findOneAndUpdate', logUpdate);
caseModel.pre('updateMany', logUpdate);
caseModel.pre('updateOne', logUpdate);
caseModel.post('findOneAndUpdate', logUpdatePost);
caseModel.post('updateMany', logUpdatePost);
caseModel.post('updateOne', logUpdatePost);
exports.Case = mongoose_1.default.model('Cases', caseModel);
//# sourceMappingURL=case.model.js.map