import mongoose, {Document} from 'mongoose';

interface ISendTo {
  admin: boolean;
  manager: boolean;
  negotiator: boolean;
  debtor: boolean;
  creditor: boolean;
}
interface INotify {
  email: boolean;
  sms: boolean;
  smsTemplate: string;
  emailTemplate: string;
  sendTo: ISendTo;
}

interface IRetryIntervalObj {
  unit: string;
  value: number;
  maxRetry: number;
}
interface IRetryInterval {
  failedAuthorization: IRetryIntervalObj;
  failedPayment: IRetryIntervalObj;
}

interface IUnitVal {
  unit: string;
  value: number;
}
interface IAuthorizationInterval {
  custom: IUnitVal;
  daily: IUnitVal;
  weekly: IUnitVal;
  fortnightly: IUnitVal;
  monthly: IUnitVal;
}

interface IPaymentsAuthorizations {
  failedAuthorizations: INotify;
  successfulAuthorizations: INotify;
  failedPayments: INotify;
  successPayments: INotify;
  upcomingPayments: INotify;
  retryInterval: IRetryInterval;
  authorizationInterval: IAuthorizationInterval;
}

interface IEmailNotify {
  name: string;
  event: string;
  html: string;
  templateId: string;
}

interface ISmsNotify {
  name: string;
  event: string;
  text: string;
  templateId: string;
}

interface INotificationTemplates {
  email: Array<IEmailNotify>;
  sms: Array<ISmsNotify>;
}

export interface ISettings extends Document {
  paymentsAuthorizations: IPaymentsAuthorizations;
  notificationTemplates: INotificationTemplates;
}
