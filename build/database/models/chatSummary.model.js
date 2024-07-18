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
exports.ChatSummary = void 0;
const mongoose_1 = __importStar(require("mongoose"));
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
});
exports.ChatSummary = mongoose_1.default.model('chatSummary', SettlementRangeSchema);
//# sourceMappingURL=chatSummary.model.js.map