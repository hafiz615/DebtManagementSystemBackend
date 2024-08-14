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
exports.ChatSummary = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const uuid_1 = require("uuid");
const SettlementRangeSchema = new mongoose_1.Schema({
    chatId: {
        type: String,
    },
    settlement_range_1: {
        lower_bound: {
            type: Number,
        },
        upper_bound: {
            type: Number,
        },
        weeks_to_payoff_lower_bound: {
            type: Number,
        },
        weeks_to_payoff_upper_bound: {
            type: Number,
        },
        reason: {
            type: String,
        },
    },
    settlement_range_2: {
        lower_bound: {
            type: Number,
        },
        upper_bound: {
            type: Number,
        },
        weeks_to_payoff_lower_bound: {
            type: Number,
        },
        weeks_to_payoff_upper_bound: {
            type: Number,
        },
        reason: {
            type: String,
        },
    },
    settlement_range_3: {
        lower_bound: {
            type: Number,
        },
        upper_bound: {
            type: Number,
        },
        weeks_to_payoff_lower_bound: {
            type: Number,
        },
        weeks_to_payoff_upper_bound: {
            type: Number,
        },
        reason: {
            type: String,
        },
    },
    logTrackingId: {
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
SettlementRangeSchema.pre('save', async function (next) {
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
        logTrackingId: previousDoc.logTrackingId,
        ip,
        userId,
        url,
        method,
    });
    logEntry.save().catch(err => {
        console.error('Error saving log entry', err);
    });
};
SettlementRangeSchema.pre('findOneAndUpdate', logUpdate);
SettlementRangeSchema.pre('updateMany', logUpdate);
SettlementRangeSchema.pre('updateOne', logUpdate);
SettlementRangeSchema.post('findOneAndUpdate', logUpdatePost);
SettlementRangeSchema.post('updateMany', logUpdatePost);
SettlementRangeSchema.post('updateOne', logUpdatePost);
exports.ChatSummary = mongoose_1.default.model('chatSummary', SettlementRangeSchema);
//# sourceMappingURL=chatSummary.model.js.map