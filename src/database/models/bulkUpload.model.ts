import mongoose, {Schema} from 'mongoose';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import {IBulkUpload} from '../interfaces/bulkUpload.interface';

const bulkUploadModel: Schema = new Schema({
  debtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debtors',
  },
  status: {
    type: String,
  },
  retries: {
    type: Number,
  },
  driveUrl: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
  createdByName: {
    type: String,
  },
  createdById: {
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

bulkUploadModel.pre('save', async function (next) {
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

bulkUploadModel.pre('findOneAndUpdate', logUpdate);
bulkUploadModel.pre('updateMany', logUpdate);
bulkUploadModel.pre('updateOne', logUpdate);

bulkUploadModel.post('findOneAndUpdate', logUpdatePost);
bulkUploadModel.post('updateMany', logUpdatePost);
bulkUploadModel.post('updateOne', logUpdatePost);

export const BulkUpload = mongoose.model<IBulkUpload>(
  'BulkUpload',
  bulkUploadModel
);
