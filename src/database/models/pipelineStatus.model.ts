import mongoose, {Schema} from 'mongoose';
import {IPipelineStatus} from '../interfaces/pipelineStatus.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
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
  let traceId = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    traceId = store.get('traceId');
  }
  const previousDoc = this.previousDoc;
  const logEntry = new UpdateLog({
    traceId: traceId,
    previousData: previousDoc,
    currentData: doc,
    model: this.model.modelName,
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
