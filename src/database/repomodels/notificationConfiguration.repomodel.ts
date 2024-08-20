import commonUtil from '../../utils/common.util';
import {INotificationUserPermission} from '../interfaces/notificationConfiguration.interface';

export class NotificationConfiguration {
  label = '';
  value = '';
  userPermission = Array<{
    role: '';
    sms_allowed: false;
    email_allowed: false;
    sms_template: '';
    email_template: '';
  }>();
  isDeleted = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
