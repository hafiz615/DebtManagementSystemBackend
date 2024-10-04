import mongoose, {Schema} from 'mongoose';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import {IDomainVerify} from '../interfaces/domainVerify.interface';

const domainVerifyModel: Schema = new Schema({
  link: {
    type: String,
  },
  from: {
    type: String,
  },
  isVerified: {
    type: Boolean,
  },
  subject: {
    type: String,
  },
  text: {
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

domainVerifyModel.pre('save', async function (next) {
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

domainVerifyModel.pre('findOneAndUpdate', logUpdate);
domainVerifyModel.pre('updateMany', logUpdate);
domainVerifyModel.pre('updateOne', logUpdate);

domainVerifyModel.post('findOneAndUpdate', logUpdatePost);
domainVerifyModel.post('updateMany', logUpdatePost);
domainVerifyModel.post('updateOne', logUpdatePost);

export const DomainVerifyLink = mongoose.model<IDomainVerify>(
  'domainVerifyLink',
  domainVerifyModel
);
