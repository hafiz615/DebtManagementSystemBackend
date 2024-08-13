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
        unit: 'days',
        value: 2,
        maxRetry: 2,
      },
      failedPayment: {
        unit: 'days',
        value: 2,
        maxRetry: 2,
      },
    },
    authorizationInterval: {
      custom: {
        unit: 'hours',
        value: 8,
      },
      daily: {
        unit: 'hours',
        value: 8,
      },
      weekly: {
        unit: 'days',
        value: 2,
      },
      fortnightly: {
        unit: 'days',
        value: 2,
      },
      monthly: {
        unit: 'days',
        value: 2,
      },
    },
  };
  notificationTemplates = Array<{
    type: '';
    name: '';
    event: '';
    templateId: '';
    content: '';
    subject: '';
  }>();
}
