import mongoose, {Schema} from 'mongoose';
import {ITasks} from '../interfaces/tasks.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
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

tasksModel.pre('findOneAndUpdate', logUpdate);
tasksModel.pre('updateMany', logUpdate);
tasksModel.pre('updateOne', logUpdate);

tasksModel.post('findOneAndUpdate', logUpdatePost);
tasksModel.post('updateMany', logUpdatePost);
tasksModel.post('updateOne', logUpdatePost);

export const Tasks = mongoose.model<ITasks>('Tasks', tasksModel);
