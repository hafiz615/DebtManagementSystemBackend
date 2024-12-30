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
exports.Call = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const callSchema = new mongoose_1.Schema({
    callSid: { type: String, default: null },
    caseId: { type: String, required: true },
    callerName: { type: String, required: true },
    accountSid: { type: String, default: null },
    callTo: { type: String, required: true },
    callFrom: { type: String, required: true },
    callStartTime: { type: String, default: '' },
    callDuration: { type: String, default: null },
    callStatus: { type: String, default: null },
    callRecordingSid: { type: String, default: '' },
    transcriptUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
// Automatically update `updatedAt` field
callSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
callSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    next();
});
// Log tracking before update
const logUpdate = async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate();
    const previousDoc = await this.model.findOne(query);
    this.previousDoc = previousDoc;
    next();
};
// Log tracking after update
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
    logEntry.save().catch((err) => {
        console.error('Error saving log entry:', err);
    });
};
// Add hooks for logging
callSchema.pre('findOneAndUpdate', logUpdate);
callSchema.post('findOneAndUpdate', logUpdatePost);
exports.Call = mongoose_1.default.model('Call', callSchema);
//# sourceMappingURL=call.model.js.map