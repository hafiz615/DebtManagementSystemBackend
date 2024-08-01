import mongoose, {Schema} from 'mongoose';
import {IStatus} from '../interfaces/status.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const status: Schema = new Schema({
  status: {
    type: Array<String>,
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

status.pre('findOneAndUpdate', logUpdate);
status.pre('updateMany', logUpdate);
status.pre('updateOne', logUpdate);

status.post('findOneAndUpdate', logUpdatePost);
status.post('updateMany', logUpdatePost);
status.post('updateOne', logUpdatePost);

export const Status = mongoose.model<IStatus>('status', status);
