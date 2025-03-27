import mongoose, {Schema} from 'mongoose';
import {IPipelineStatus} from '../interfaces/pipelineStatus.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const pipelineStatus: Schema = new Schema({
  pipeline: {
    type: String,
  },
  status: {
    type: Array<{name: ''; type: ''}>,
  },
  description: {
    type: String,
  },
  userId: {
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

pipelineStatus.pre('save', async function (next) {
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

pipelineStatus.pre('findOneAndUpdate', logUpdate);
pipelineStatus.pre('updateMany', logUpdate);
pipelineStatus.pre('updateOne', logUpdate);

pipelineStatus.post('findOneAndUpdate', logUpdatePost);
pipelineStatus.post('updateMany', logUpdatePost);
pipelineStatus.post('updateOne', logUpdatePost);

export const PipelineStatus = mongoose.model<IPipelineStatus>(
  'pipelineStatus',
  pipelineStatus
);
