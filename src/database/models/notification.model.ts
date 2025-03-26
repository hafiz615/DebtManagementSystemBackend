import mongoose, {Schema} from 'mongoose';
import {INotification} from '../interfaces/notification.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const notification: Schema = new Schema({
  text: {
    type: String,
  },
  caseId: {
    type: String,
  },
  inboxId: {
    type: String,
  },
  debtorId: {
    type: String,
  },
  userId: {
    type: String,
  },
  type: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isLinked: {
    type: Boolean,
    default: false,
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

notification.pre('save', async function (next) {
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
    createdAt: new Date(commonUtil.getCurrentDate()),
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

notification.pre('findOneAndUpdate', logUpdate);
notification.pre('updateMany', logUpdate);
notification.pre('updateOne', logUpdate);

notification.post('findOneAndUpdate', logUpdatePost);
notification.post('updateMany', logUpdatePost);
notification.post('updateOne', logUpdatePost);

export const Notification = mongoose.model<INotification>(
  'notification',
  notification
);
