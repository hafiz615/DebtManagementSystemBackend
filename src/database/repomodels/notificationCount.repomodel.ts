import commonUtil from '../../utils/common.util';

export class NotificationCount {
  count = 0;
  smsCount = 0;
  emailCount = 0;
  taskCount = 0;
  callCount = 0;
  smsNotificationCount = 0;
  emailNotificationCount = 0;
  taskNotificationCount = 0;
  missCallCount = 0;
  rejectCallCount = 0;
  userId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
