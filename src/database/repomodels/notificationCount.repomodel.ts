import commonUtil from '../../utils/common.util';

export class NotificationCount {
  count = 0;
  smsCount = 0;
  emailCount = 0;
  userId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
