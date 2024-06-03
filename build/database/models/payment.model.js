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
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentModel = new mongoose_1.Schema({
    caseId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Cases',
    },
    authorized: {
        type: String,
        default: 'Pending',
    },
    captured: {
        type: String,
        default: 'Pending',
    },
    status: {
        type: String,
        default: 'Pending',
    },
    amount: {
        type: Number,
        default: 0,
    },
    dueDate: {
        type: Date,
    },
    frequency: {
        type: Number,
        default: 0,
    },
    intervalId: {
        type: String,
    },
    failedReasonAuthorization: {
        type: String,
    },
    failedReasonCaptured: {
        type: String,
    },
    rescheduled: {
        type: String,
    },
    debtorTransId: {
        type: String,
    },
    commissionTransId: {
        type: String,
    },
    retriesAuth: {
        type: Number,
    },
    retriesCapture: {
        type: Number,
    },
    commission: {
        type: Number,
    },
    calculatedCommision: {
        type: Number,
    },
    timePeriod: {
        type: String,
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
exports.Payment = mongoose_1.default.model('Payments', PaymentModel);
//# sourceMappingURL=payment.model.js.map