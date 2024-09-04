import {Document} from 'mongoose';

export interface IChatSummary extends Document {
  chatId: string;
  prompt: string;
  settlement_range_1: {
    lower_bound: number;
    upper_bound: number;
    weeks_to_payoff_lower_bound: number;
    weeks_to_payoff_upper_bound: number;
    reason: string;
  };
  settlement_range_2: {
    lower_bound: number;
    upper_bound: number;
    weeks_to_payoff_lower_bound: number;
    weeks_to_payoff_upper_bound: number;
    reason: string;
  };
  settlement_range_3: {
    lower_bound: number;
    upper_bound: number;
    weeks_to_payoff_lower_bound: number;
    weeks_to_payoff_upper_bound: number;
    reason: string;
  };
  createdAt: string;
  updatedAt: string;
}
