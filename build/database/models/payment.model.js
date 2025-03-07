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
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const paymentLogs_model_1 = __importDefault(require("./paymentLogs.model"));
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
        default: 'Upcoming',
    },
    sendViaPaynote: {
        type: String,
        default: 'Pending',
    },
    paynoteCheckId: {
        type: String,
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
    debtorId: {
        type: String,
    },
    failedReasonAuthorization: {
        type: String,
    },
    failedReasonCaptured: {
        type: String,
    },
    failedReasonPaynote: {
        type: String,
    },
    rescheduled: {
        type: Date,
    },
    debtorTransId: {
        type: String,
    },
    retriesAuth: {
        type: Number,
    },
    retriesCapture: {
        type: Number,
    },
    retriesPaynote: {
        type: Number,
    },
    timePeriod: {
        type: String,
    },
    paymentReference: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
    },
    logTrackingId: {
        type: String,
    },
    paymentReferenceBool: {
        type: Boolean,
    },
    commission: {
        type: Number,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
    transactionType: {
        type: String,
    },
    paymentGateway: {
        type: String,
    },
    manualCommission: {
        type: Number,
    },
    paymentLink: {
        type: String,
    },
    debtorName: {
        type: String,
    },
    authorizedDate: {
        type: Date,
    },
    serviceFee: {
        type: Number,
    },
    legalFee: {
        type: Number,
    },
    creditorName: String,
});
PaymentModel.pre('save', async function (next) {
    this.logTrackingId = (0, uuid_1.v4)();
    next();
});
PaymentModel.pre('insertMany', async function (next, docs) {
    for (const doc of docs) {
        doc.logTrackingId = (0, uuid_1.v4)();
    }
    next();
});
// Middleware for logging updates
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
    const logEntry = new paymentLogs_model_1.default({
        traceId,
        previousData: previousDoc,
        currentData: doc,
        model: this.model.modelName,
        logTrackingId: previousDoc?.logTrackingId ?? '',
        ip,
        userId,
        url,
        method,
    });
    logEntry.save().catch(err => {
        console.error('Error saving log entry', err);
    });
};
PaymentModel.pre('findOneAndUpdate', logUpdate);
PaymentModel.pre('updateMany', logUpdate);
PaymentModel.pre('updateOne', logUpdate);
PaymentModel.post('findOneAndUpdate', logUpdatePost);
PaymentModel.post('updateMany', logUpdatePost);
PaymentModel.post('updateOne', logUpdatePost);
exports.Payment = mongoose_1.default.model('Payments', PaymentModel);
//# sourceMappingURL=payment.model.js.map