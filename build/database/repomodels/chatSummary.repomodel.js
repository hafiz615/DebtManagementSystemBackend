"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSummary = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class ChatSummary {
    constructor() {
        this.chatId = '';
        this.settlement_range_1 = {
            lower_bound: 0,
            upper_bound: 0,
            weeks_to_payoff_lower_bound: 0,
            weeks_to_payoff_upper_bound: 0,
            reason: '',
        };
        this.settlement_range_2 = {
            lower_bound: 0,
            upper_bound: 0,
            weeks_to_payoff_lower_bound: 0,
            weeks_to_payoff_upper_bound: 0,
            reason: '',
        };
        this.settlement_range_3 = {
            lower_bound: 0,
            upper_bound: 0,
            weeks_to_payoff_lower_bound: 0,
            weeks_to_payoff_upper_bound: 0,
            reason: '',
        };
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.ChatSummary = ChatSummary;
//# sourceMappingURL=chatSummary.repomodel.js.map