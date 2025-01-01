import mongoose, {Schema} from 'mongoose';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import {IDomainVerify} from '../interfaces/domainVerify.interface';
import {ICheck} from '../interfaces/check.interface';

const checkModel: Schema = new Schema({
  checkId: {
    type: String,
  },
  debtorId: {
    type: String,
  },
  number: {
    type: String,
  },
  status: {
    type: String,
  },
  basicVerification: {
    type: String,
  },
  fundsConfirmation: {
    type: String,
  },
  bvReason: {
    type: String,
  },
  fcReason: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
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

checkModel.pre('save', async function (next) {
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

checkModel.pre('findOneAndUpdate', logUpdate);
checkModel.pre('updateMany', logUpdate);
checkModel.pre('updateOne', logUpdate);

checkModel.post('findOneAndUpdate', logUpdatePost);
checkModel.post('updateMany', logUpdatePost);
checkModel.post('updateOne', logUpdatePost);

export const Check = mongoose.model<ICheck>('check', checkModel);
