import commonUtil from '../../utils/common.util';

export class ChatSummary {
  chatId = '';
  prompt = '';
  settlement_range_1 = {
    lower_bound: 0,
    upper_bound: 0,
    weeks_to_payoff_lower_bound: 0,
    weeks_to_payoff_upper_bound: 0,
    reason: '',
  };
  settlement_range_2 = {
    lower_bound: 0,
    upper_bound: 0,
    weeks_to_payoff_lower_bound: 0,
    weeks_to_payoff_upper_bound: 0,
    reason: '',
  };
  settlement_range_3 = {
    lower_bound: 0,
    upper_bound: 0,
    weeks_to_payoff_lower_bound: 0,
    weeks_to_payoff_upper_bound: 0,
    reason: '',
  };
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
