import mongoose, {Schema} from 'mongoose';
import {ISettings} from '../interfaces/settings.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const settignsModel: Schema = new Schema({
  paymentsAuthorizations: {
    failedAuthorizations: {
      email: {
        type: Boolean,
      },
      sms: {
        type: Boolean,
      },
      smsTemplate: {
        type: String,
      },
      emailTemplate: {
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
      smsTemplate: {
        type: String,
      },
      emailTemplate: {
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
      smsTemplate: {
        type: String,
      },
      emailTemplate: {
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
      smsTemplate: {
        type: String,
      },
      emailTemplate: {
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
      smsTemplate: {
        type: String,
      },
      emailTemplate: {
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
      type: Array<{name: ''; event: ''; html: ''; templateId: ''; subject: ''}>,
    },
    sms: {
      type: Array<{name: ''; event: ''; text: ''; templateId: ''}>,
    },
  },
});

const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
  // Retrieve the document before update
  const previousDoc = await this.model.findOne(query);
  this.previousDoc = previousDoc;
  next();
};

const logUpdatePost = async function (doc) {
  let traceId = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    traceId = store.get('traceId');
  }
  const previousDoc = this.previousDoc;
  const logEntry = new UpdateLog({
    traceId: traceId,
    previousData: previousDoc,
    currentData: doc,
    model: this.model.modelName,
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

settignsModel.pre('findOneAndUpdate', logUpdate);
settignsModel.pre('updateMany', logUpdate);
settignsModel.pre('updateOne', logUpdate);

settignsModel.post('findOneAndUpdate', logUpdatePost);
settignsModel.post('updateMany', logUpdatePost);
settignsModel.post('updateOne', logUpdatePost);

export const Settings = mongoose.model<ISettings>('Settings', settignsModel);
