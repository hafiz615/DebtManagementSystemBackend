import commonUtil from '../../utils/common.util';

export class ChatSummary {
  chatId = '';
  prompt = '';
  chat = {};
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
