import mongoose, {Schema} from 'mongoose';
import {ITargetCustomFields} from '../interfaces/customField.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const targetCustomFields: Schema = new Schema({
  target: {
    type: String,
  },
  customFields: {
    type: Array<{
      name: {type: String};
      value: {type: Schema.Types.Mixed};
    }>,
  },
  caseId: {
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

targetCustomFields.pre('save', async function (next) {
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

targetCustomFields.pre('findOneAndUpdate', logUpdate);
targetCustomFields.pre('updateMany', logUpdate);
targetCustomFields.pre('updateOne', logUpdate);

targetCustomFields.post('findOneAndUpdate', logUpdatePost);
targetCustomFields.post('updateMany', logUpdatePost);
targetCustomFields.post('updateOne', logUpdatePost);

export const TargetCustomFields = mongoose.model<ITargetCustomFields>(
  'targetcustomfields',
  targetCustomFields
);
