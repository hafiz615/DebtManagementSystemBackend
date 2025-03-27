import mongoose, {Schema} from 'mongoose';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import {ISyncPaymentMethod} from '../interfaces/syncPaymentMethod.interface';
import commonUtil from '../../utils/common.util';

const syncPaymentMethodModel = new Schema({
  syncId: {
    type: String,
  },
  email: {
    type: String,
  },
  logTrackingId: {
    type: String,
  },
  platform: {
    type: String,
  },
  customerVaultId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  },
});

syncPaymentMethodModel.pre('save', async function (next) {
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

syncPaymentMethodModel.pre('findOneAndUpdate', logUpdate);
syncPaymentMethodModel.pre('updateMany', logUpdate);
syncPaymentMethodModel.pre('updateOne', logUpdate);

syncPaymentMethodModel.post('findOneAndUpdate', logUpdatePost);
syncPaymentMethodModel.post('updateMany', logUpdatePost);
syncPaymentMethodModel.post('updateOne', logUpdatePost);

export const SyncPaymentMethod = mongoose.model<ISyncPaymentMethod>(
  'syncPaymentMethod',
  syncPaymentMethodModel
);
