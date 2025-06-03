import mongoose, {Schema} from 'mongoose';
import {IAttorney} from '../interfaces/attorney.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';
import {IAccount} from '../interfaces/account.interface';
import {IWaterfall} from '../interfaces/waterfall.interface';

const waterfallModel: Schema = new Schema({
  debtorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debtors',
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payments',
  },
  execute: {
    type: Boolean,
  },
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
});

waterfallModel.pre('save', async function (next) {
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
    createdAt: commonUtil.getCurrentDate(),
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

waterfallModel.pre('findOneAndUpdate', logUpdate);
waterfallModel.pre('updateMany', logUpdate);
waterfallModel.pre('updateOne', logUpdate);

waterfallModel.post('findOneAndUpdate', logUpdatePost);
waterfallModel.post('updateMany', logUpdatePost);
waterfallModel.post('updateOne', logUpdatePost);

export const Waterfall = mongoose.model<IWaterfall>(
  'Waterfall',
  waterfallModel
);
