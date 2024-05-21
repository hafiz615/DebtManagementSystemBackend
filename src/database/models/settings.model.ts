import mongoose, {Schema} from 'mongoose';
import {ISettings} from '../interfaces/settings.interface';

const settignsModel: Schema = new Schema({
  paymentsAuthorizations: {
    failedAuthorizations: {
      email: {
        type: Boolean,
      },
      sms: {
        type: Boolean,
      },
      template: {
        type: String,
      },
      sendTo: {
        admin: {
          type: Boolean,
        },
        manager: {
          type: Boolean,
        },
        negotiator: {
          type: Boolean,
        },
        debtor: {
          type: Boolean,
        },
        creditor: {
          type: Boolean,
        },
      },
    },
    successfulAuthorizations: {
      email: {
        type: Boolean,
      },
      sms: {
        type: Boolean,
      },
      template: {
        type: String,
      },
      sendTo: {
        admin: {
          type: Boolean,
        },
        manager: {
          type: Boolean,
        },
        negotiator: {
          type: Boolean,
        },
        debtor: {
          type: Boolean,
        },
        creditor: {
          type: Boolean,
        },
      },
    },
    failedPayments: {
      email: {
        type: Boolean,
      },
      sms: {
        type: Boolean,
      },
      template: {
        type: String,
      },
      sendTo: {
        admin: {
          type: Boolean,
        },
        manager: {
          type: Boolean,
        },
        negotiator: {
          type: Boolean,
        },
        debtor: {
          type: Boolean,
        },
        creditor: {
          type: Boolean,
        },
      },
    },
    successPayments: {
      email: {
        type: Boolean,
      },
      sms: {
        type: Boolean,
      },
      template: {
        type: String,
      },
      sendTo: {
        admin: {
          type: Boolean,
        },
        manager: {
          type: Boolean,
        },
        negotiator: {
          type: Boolean,
        },
        debtor: {
          type: Boolean,
        },
        creditor: {
          type: Boolean,
        },
      },
    },
    upcomingPayments: {
      email: {
        type: Boolean,
      },
      sms: {
        type: Boolean,
      },
      template: {
        type: String,
      },
      sendTo: {
        admin: {
          type: Boolean,
        },
        manager: {
          type: Boolean,
        },
        negotiator: {
          type: Boolean,
        },
        debtor: {
          type: Boolean,
        },
        creditor: {
          type: Boolean,
        },
      },
    },
    retryInterval: {
      failedAuthorization: {
        unit: {
          type: String,
        },
        value: {
          type: Number,
        },
        maxRetry: {
          type: Number,
        },
        retryCount: {
          type: Number,
        },
      },
      failedPayment: {
        unit: {
          type: String,
        },
        value: {
          type: Number,
        },
        maxRetry: {
          type: Number,
        },
        retryCount: {
          type: Number,
        },
      },
    },
    authorizationInterval: {
      custom: {
        unit: {
          type: String,
        },
        value: {
          type: Number,
        },
      },
      daily: {
        unit: {
          type: String,
        },
        value: {
          type: Number,
        },
      },
      weekly: {
        unit: {
          type: String,
        },
        value: {
          type: Number,
        },
      },
      fortnightly: {
        unit: {
          type: String,
        },
        value: {
          type: Number,
        },
      },
      monthly: {
        unit: {
          type: String,
        },
        value: {
          type: Number,
        },
      },
    },
  },
  notificationTemplates: {
    email: {
      type: Array<{name: ''; event: ''; html: ''}>,
    },
    sms: {
      type: Array<{name: ''; event: ''; text: ''}>,
    },
  },
  customFields: {
    type: Array<{name: ''; type: ''; target: ''; description: ''; shared: ''}>,
  },
});

export const Settings = mongoose.model<ISettings>('Settings', settignsModel);
