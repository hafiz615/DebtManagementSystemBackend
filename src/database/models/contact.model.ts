import mongoose, {Schema} from 'mongoose';
import {IContact} from '../interfaces/contact.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
  country: {
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

contactModel.pre('findOneAndUpdate', logUpdate);
contactModel.pre('updateMany', logUpdate);
contactModel.pre('updateOne', logUpdate);

contactModel.post('findOneAndUpdate', logUpdatePost);
contactModel.post('updateMany', logUpdatePost);
contactModel.post('updateOne', logUpdatePost);

export const Contact = mongoose.model<IContact>('Contacts', contactModel);
