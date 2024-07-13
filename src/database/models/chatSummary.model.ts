import mongoose, {Schema} from 'mongoose';
import {IChatSummary} from '../interfaces/chatSummary.interface';

const SettlementRangeSchema = new Schema({
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

export const ChatSummary = mongoose.model<IChatSummary>(
  'chatSummary',
  SettlementRangeSchema
);
