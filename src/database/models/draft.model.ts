import mongoose, {Schema} from 'mongoose';
import {IDraft} from '../interfaces/draft.interface'; 
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

const draft: Schema = new Schema({
  userId: {
    type: String,
  },
  caseId: {
    type: String,
  },
  from: {
    type: String,
  },
  to: {
    type: String,
  },
  cc: {
    type: Schema.Types.Mixed,
  },
  subject: {
    type: String,
  },
  content: {
    type: String,
  },
  caseCode: {
    type: String,
  },
  debtorCompanyName: {
    type: String,
  },
  creditorCompanyName: {
    type: String,
  },
  negotiatorName: {
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

draft.pre('save', async function (next) {
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

draft.pre('findOneAndUpdate', logUpdate);
draft.pre('updateMany', logUpdate);
draft.pre('updateOne', logUpdate);

draft.post('findOneAndUpdate', logUpdatePost);
draft.post('updateMany', logUpdatePost);
draft.post('updateOne', logUpdatePost);

export const Draft = mongoose.model<IDraft>('draft', draft);
