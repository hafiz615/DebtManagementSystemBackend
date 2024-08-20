export interface INotificationUserPermission {
  role: string;
  sms_allowed: false;
  email_allowed: false;
  sms_template: string;
  email_template: string;
}
export interface INotificationConfiguration {
  label: string;
  value: string;
  userPermission: Array<INotificationUserPermission>;
  isDeleted: false;
  createdAt: string;
  updatedAt: string;
}
