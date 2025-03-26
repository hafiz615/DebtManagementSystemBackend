import mongoose, {Schema} from 'mongoose';
import {IContact} from '../interfaces/contact.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const contactModel: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    // unique: true,
  },
  email: {
    type: String,
    // unique: true,
    required: true,
  },
  relationWithDebtor: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  zipCode: {
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

contactModel.pre('save', async function (next) {
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
    createdAt: new Date(commonUtil.getCurrentDate()),
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

contactModel.pre('findOneAndUpdate', logUpdate);
contactModel.pre('updateMany', logUpdate);
contactModel.pre('updateOne', logUpdate);

contactModel.post('findOneAndUpdate', logUpdatePost);
contactModel.post('updateMany', logUpdatePost);
contactModel.post('updateOne', logUpdatePost);

export const Contact = mongoose.model<IContact>('Contacts', contactModel);
