import mongoose, {Schema} from 'mongoose';
import {ICreditor} from '../interfaces/creditor.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

const creditorModel: Schema = new Schema({
  basicInformation: {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  businessInformation: {
    companyName: {
      type: String,
      required: true,
    },
    businessCategory: {
      type: String,
      required: true,
    },
  },
  contacts: {
    type: [
      {
        name: String,
        title: String,
        phone: String,
        email: String,
        relationWithCreditor: String,
        state: String,
        city: String,
        zipCode: String,
      },
    ],
  },
  notes: {
    type: String,
  },
  lastFundedDate: {
    type: Date,
    required: false,
  },
  historicalRange: {
    minimum: {
      type: Number,
      required: false,
    },
    maximum: {
      type: Number,
      required: true,
    },
  },
  // creditorSecurityKey: {
  //   type: String,
  // },
  paynoteUserId: {
    type: String,
  },
  paynoteSourceId: {
    type: String,
  },
  accountTitle: {
    type: String,
  },
  accountTitleMapping: {
    type: Array<{
      caseId: '';
      accountTitle: '';
    }>,
  },
  // paymentType: {
  //   type: String,
  // },
  // customerVaultId: {
  //   type: String,
  // },
  logTrackingId: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
  aggression: {
    type: Number,
  },
});

creditorModel.pre('save', async function (next) {
  this.logTrackingId = v4();
  next();
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
  let traceId = '',
    ip = '',
    userId = '',
    url = '',
    method = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    if (store.get('traceId')) traceId = store.get('traceId');
    if (store.get('ip')) ip = store.get('ip');
    if (store.get('userId')) userId = store.get('userId');
    if (store.get('url')) url = store.get('url');
    if (store.get('method')) method = store.get('method');
  }
  const previousDoc = this.previousDoc;
  const logEntry = new UpdateLog({
    traceId,
    previousData: previousDoc,
    currentData: doc,
    model: this.model.modelName,
    logTrackingId: previousDoc?.logTrackingId ?? '',
    ip,
    userId,
    url,
    method,
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

creditorModel.pre('findOneAndUpdate', logUpdate);
creditorModel.pre('updateMany', logUpdate);
creditorModel.pre('updateOne', logUpdate);

creditorModel.post('findOneAndUpdate', logUpdatePost);
creditorModel.post('updateMany', logUpdatePost);
creditorModel.post('updateOne', logUpdatePost);

export const Creditor = mongoose.model<ICreditor>('Creditors', creditorModel);
