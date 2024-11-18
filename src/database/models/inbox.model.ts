import mongoose, {Schema} from 'mongoose';
import {IInbox} from '../interfaces/inbox.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

const inbox: Schema = new Schema({
  from: {
    type: String,
  },
  to: {
    type: String,
  },
  cC: {
    type: String,
  },
  subject: {
    type: String,
  },
  name: {
    type: String,
  },
  text: {
    type: String,
  },
  textAsHtml: {
    type: String,
  },
  caseCode: {
    type: String,
  },
  isRead: {
    type: Boolean,
  },
  type: {
    type: String,
  },
  debitorCompanyName: {
    type: String,
  },
  creditorCompanyName: {
    type: String,
  },
  negotiatorName: {
    type: String,
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

inbox.pre('save', async function (next) {
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

inbox.pre('findOneAndUpdate', logUpdate);
inbox.pre('updateMany', logUpdate);
inbox.pre('updateOne', logUpdate);

inbox.post('findOneAndUpdate', logUpdatePost);
inbox.post('updateMany', logUpdatePost);
inbox.post('updateOne', logUpdatePost);

export const Inbox = mongoose.model<IInbox>('inbox', inbox);
