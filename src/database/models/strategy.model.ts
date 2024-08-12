import mongoose, {Schema} from 'mongoose';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {IStrategy} from '../interfaces/strategy.interface';

const strategy: Schema = new Schema({
  caseId: {
    type: String,
  },
  name: {
    type: String,
  },
  data: {
    type: Schema.Types.Mixed,
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

strategy.pre('findOneAndUpdate', logUpdate);
strategy.pre('updateMany', logUpdate);
strategy.pre('updateOne', logUpdate);

strategy.post('findOneAndUpdate', logUpdatePost);
strategy.post('updateMany', logUpdatePost);
strategy.post('updateOne', logUpdatePost);

export const Strategy = mongoose.model<IStrategy>('strategy', strategy);
