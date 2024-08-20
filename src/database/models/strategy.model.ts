import mongoose, {Schema} from 'mongoose';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {IStrategy} from '../interfaces/strategy.interface';
import {v4} from 'uuid';

const strategy: Schema = new Schema({
  caseId: {
    type: String,
  },
  name: {
    type: String,
  },
  data: {
    type: Schema.Types.Mixed,
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

strategy.pre('save', async function (next) {
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

strategy.pre('findOneAndUpdate', logUpdate);
strategy.pre('updateMany', logUpdate);
strategy.pre('updateOne', logUpdate);

strategy.post('findOneAndUpdate', logUpdatePost);
strategy.post('updateMany', logUpdatePost);
strategy.post('updateOne', logUpdatePost);

export const Strategy = mongoose.model<IStrategy>('strategy', strategy);
