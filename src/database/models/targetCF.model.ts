import mongoose, {Schema} from 'mongoose';
import {ITargetCustomFields} from '../interfaces/customField.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
