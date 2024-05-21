class Notify {
  email = false;
  sms = false;
  template = '';
  sendTo = {
    admin: false,
    manager: false,
    negotiator: false,
    debtor: false,
    creditor: false,
  };
}

class RetryInterval {
  unit = '';
  value = 0;
  maxRetry = 0;
  retryCount = 0;
}

class UnitVal {
  unit = '';
  value = 0;
}

class EmailNotify {
  name = '';
  event = '';
  html = '';
}

class SmsNotify {
  name = '';
  event = '';
  text = '';
}

export class Settings {
  paymentsAuthorizations = {
    failedAuthorizations: Notify,
    successfulAuthorizations: Notify,
    failedPayments: Notify,
    successPayments: Notify,
    upcomingPayments: Notify,
    retryInterval: {
      failedAuthorization: RetryInterval,
      failedPayment: RetryInterval,
    },
    authorizationInterval: {
      custom: UnitVal,
      daily: UnitVal,
      weekly: UnitVal,
      fortnightly: UnitVal,
      monthly: UnitVal,
    },
  };
  notificationTemplates = {
    email: Array<EmailNotify>(),
    sms: Array<SmsNotify>(),
  };
  customFields = Array<{
    name: '';
    type: '';
    target: '';
    description: '';
    shared: '';
  }>();
}
