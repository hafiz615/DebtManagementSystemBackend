import commonUtil from '../../utils/common.util';

export class EmailThreading {
  threadId = '';
  userId = '';
  firstInboxMessage = '';
  previousMessages: string[] = [];
  isDeleted = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
