import mongoose, {Schema} from 'mongoose';
import {ILawsuit} from '../interfaces/lawsuit.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

const lawsuitModel: Schema = new Schema({
  lawfirmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawfirms',
  },
  attorneyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attorneys',
  },
  debtorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debtors',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  creditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creditors',
  },
  lawsuitResolved: {
    type: Boolean,
  },
  lawsuitPaidAmount: {
    type: Number,
  },
  lawsuitPaidCount: {
    type: Number,
  },
  lawsuitReceiveAmount: {
    type: Number,
  },
  lawsuitReceiveCount: {
    type: Number,
  },
  lawfirmCompanyName: {
    type: String,
  },
  defendentCompanyName: {
    type: String,
  },
  plantiffCompanyName: {
    type: String,
  },
  logTrackingId: {
    type: String,
  },
  lawsuitDate: {
    type: Date,
  },
  balance: {
    type: Number,
  },
  attorneyPaymentsProceed: {
    type: Boolean,
  },
  intervals: {
    type: [
      {
        amount: {type: Number, required: true},
        startDate: {type: Date, required: true},
        frequency: {type: Number, default: 0},
        timePeriod: {type: String, required: true},
      },
    ],
  },
  isExempt: Boolean,
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
});

lawsuitModel.pre('save', async function (next) {
  this.logTrackingId = v4();
  next();
});

const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
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
    traceId = store.get('traceId') || '';
    ip = store.get('ip') || '';
    userId = store.get('userId') || '';
    url = store.get('url') || '';
    method = store.get('method') || '';
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

lawsuitModel.pre('findOneAndUpdate', logUpdate);
lawsuitModel.pre('updateMany', logUpdate);
lawsuitModel.pre('updateOne', logUpdate);

lawsuitModel.post('findOneAndUpdate', logUpdatePost);
lawsuitModel.post('updateMany', logUpdatePost);
lawsuitModel.post('updateOne', logUpdatePost);

export const Lawsuit = mongoose.model<ILawsuit>('Lawsuits', lawsuitModel);
