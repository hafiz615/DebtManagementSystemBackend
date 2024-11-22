import commonUtil from '../../utils/common.util';

export class NotificationCount {
  count = 0;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
