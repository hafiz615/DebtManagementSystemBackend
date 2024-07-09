export class Settings {
  paymentsAuthorizations = {
    failedAuthorizations: {
      email: false,
      sms: false,
      smsTemplate: '',
      emailTemplate: '',
      sendTo: {
        admin: false,
        manager: false,
        negotiator: false,
        debtor: false,
        creditor: false,
      },
    },
    successfulAuthorizations: {
      email: false,
      sms: false,
      smsTemplate: '',
      emailTemplate: '',
      sendTo: {
        admin: false,
        manager: false,
        negotiator: false,
        debtor: false,
        creditor: false,
      },
    },
    failedPayments: {
      email: false,
      sms: false,
      smsTemplate: '',
      emailTemplate: '',
      sendTo: {
        admin: false,
        manager: false,
        negotiator: false,
        debtor: false,
        creditor: false,
      },
    },
    successPayments: {
      email: false,
      sms: false,
      smsTemplate: '',
      emailTemplate: '',
      sendTo: {
        admin: false,
        manager: false,
        negotiator: false,
        debtor: false,
        creditor: false,
      },
    },
    upcomingPayments: {
      email: false,
      sms: false,
      smsTemplate: '',
      emailTemplate: '',
      sendTo: {
        admin: false,
        manager: false,
        negotiator: false,
        debtor: false,
        creditor: false,
      },
    },
    retryInterval: {
      failedAuthorization: {
        unit: '',
        value: 0,
        maxRetry: 0,
      },
      failedPayment: {
        unit: '',
        value: 0,
        maxRetry: 0,
      },
    },
    authorizationInterval: {
      custom: {
        unit: 'hours',
        value: 0,
      },
      daily: {
        unit: 'hours',
        value: 0,
      },
      weekly: {
        unit: 'days',
        value: 0,
      },
      fortnightly: {
        unit: 'days',
        value: 0,
      },
      monthly: {
        unit: 'days',
        value: 0,
      },
    },
  };
  notificationTemplates = {
    email: Array<{
      name: '';
      event: '';
      html: '';
      subject: '';
      templateId: '';
    }>(),
    sms: Array<{
      name: '';
      event: '';
      text: '';
      templateId: '';
    }>(),
  };
}
