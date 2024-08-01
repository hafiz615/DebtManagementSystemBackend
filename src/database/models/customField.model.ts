import mongoose, {Schema} from 'mongoose';
import {ICustomField} from '../interfaces/customField.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const customFieldsModel: Schema = new Schema({
  name: {
    type: String,
  },
  type: {
    type: String,
  },
  target: {
    type: String,
  },
  description: {
    type: String,
  },
  shared: {
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

customFieldsModel.pre('findOneAndUpdate', logUpdate);
customFieldsModel.pre('updateMany', logUpdate);
customFieldsModel.pre('updateOne', logUpdate);

customFieldsModel.post('findOneAndUpdate', logUpdatePost);
customFieldsModel.post('updateMany', logUpdatePost);
customFieldsModel.post('updateOne', logUpdatePost);

customFieldsModel.index({name: 1, target: 1}, {unique: true});

export const CustomFiled = mongoose.model<ICustomField>(
  'CustomFields',
  customFieldsModel
);
