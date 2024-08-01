import mongoose, {Schema} from 'mongoose';
import {ICreditor} from '../interfaces/creditor.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
    type: Array<{
      name: '';
      title: '';
      phone: '';
      email: '';
      relationWithCreditor: '';
      country: '';
      state: '';
      city: '';
      zipCode: '';
    }>,
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
  creditorSecurityKey: {
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
  paymentType: {
    type: String,
  },
  customerVaultId: {
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

creditorModel.pre('findOneAndUpdate', logUpdate);
creditorModel.pre('updateMany', logUpdate);
creditorModel.pre('updateOne', logUpdate);

creditorModel.post('findOneAndUpdate', logUpdatePost);
creditorModel.post('updateMany', logUpdatePost);
creditorModel.post('updateOne', logUpdatePost);

export const Creditor = mongoose.model<ICreditor>('Creditors', creditorModel);
