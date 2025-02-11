import mongoose, {Schema} from 'mongoose';
import {ITasks} from '../interfaces/tasks.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

const tasksModel = new Schema({
  target: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  caseId: {
    type: String,
  },
  assignee: {
    type: String,
  },
  assigneeId: {
    type: String,
  },
  title: {
    type: String,
  },
  status: {
    type: String,
  },
  notes: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  logTrackingId: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
});

tasksModel.pre('save', async function (next) {
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

tasksModel.pre('findOneAndUpdate', logUpdate);
tasksModel.pre('updateMany', logUpdate);
tasksModel.pre('updateOne', logUpdate);

tasksModel.post('findOneAndUpdate', logUpdatePost);
tasksModel.post('updateMany', logUpdatePost);
tasksModel.post('updateOne', logUpdatePost);

export const Tasks = mongoose.model<ITasks>('Tasks', tasksModel);
