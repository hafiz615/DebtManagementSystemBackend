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
exports.Lawsuit = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const uuid_1 = require("uuid");
const lawsuitModel = new mongoose_1.Schema({
    lawfirmId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Lawfirms',
    },
    attorneyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Attorneys',
    },
    debtorId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Debtors',
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Users',
    },
    creditorId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Creditors',
    },
    lawsuitStatus: {
        type: Boolean,
    },
    lawsuitPaidAmount: {
        type: Number,
    },
    lawsuitPaidCount: {
        type: Number,
    },
    lawsuitReceiveAmount: {
        type: Number,
    },
    lawsuitReceiveCount: {
        type: Number,
    },
    lawfirmCompanyName: {
        type: String,
    },
    defendentCompanyName: {
        type: String,
    },
    plantiffCompanyName: {
        type: String,
    },
    logTrackingId: {
        type: String,
    },
    lawsuitDate: {
        type: Date,
    },
    balance: {
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
    isExempt: Boolean,
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
});
lawsuitModel.pre('save', async function (next) {
    this.logTrackingId = (0, uuid_1.v4)();
    next();
});
const logUpdate = async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate();
    const previousDoc = await this.model.findOne(query);
    this.previousDoc = previousDoc;
    next();
};
const logUpdatePost = async function (doc) {
    let traceId = '', ip = '', userId = '', url = '', method = '';
    const store = localStorage_util_1.default.getStore();
    if (store) {
        traceId = store.get('traceId') || '';
        ip = store.get('ip') || '';
        userId = store.get('userId') || '';
        url = store.get('url') || '';
        method = store.get('method') || '';
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
    });
    logEntry.save().catch(err => {
        console.error('Error saving log entry', err);
    });
};
lawsuitModel.pre('findOneAndUpdate', logUpdate);
lawsuitModel.pre('updateMany', logUpdate);
lawsuitModel.pre('updateOne', logUpdate);
lawsuitModel.post('findOneAndUpdate', logUpdatePost);
lawsuitModel.post('updateMany', logUpdatePost);
lawsuitModel.post('updateOne', logUpdatePost);
exports.Lawsuit = mongoose_1.default.model('Lawsuits', lawsuitModel);
//# sourceMappingURL=lawsuit.model.js.map