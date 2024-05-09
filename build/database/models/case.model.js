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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Case = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const caseModel = new mongoose_1.Schema({
    debtor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: 'Debtors',
    },
    creditor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: 'Creditors',
    },
    totalDebt: {
        type: Number,
        required: true,
    },
    lastPaymentDate: {
        type: Date,
    },
    paidAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'Pending',
    },
    caseOwner: {
        type: String,
        required: true,
    },
    caseCode: {
        type: String,
        required: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
    remaining: {
        type: Number,
        required: true,
    },
    documents: {
        type: [
            {
                key: { type: String, required: true },
                originalFileName: { type: String, required: true },
                url: { type: String, default: '' },
            },
        ],
    },
    paymentPlanStartDate: {
        type: Date,
        required: true,
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
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
});
exports.Case = mongoose_1.default.model('Cases', caseModel);
//# sourceMappingURL=case.model.js.map