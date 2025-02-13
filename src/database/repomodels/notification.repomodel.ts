import commonUtil from '../../utils/common.util';

export class Notification {
  caseId = '';
  inboxId = '';
  debtorId = '';
  userId = '';
  type = '';
  text = '';
  isRead = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
