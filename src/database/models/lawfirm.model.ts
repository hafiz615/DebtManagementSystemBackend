import mongoose, {Schema} from 'mongoose';
import {ILawfirm} from '../interfaces/lawfirm.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

const lawfirmModel: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  lawfirmCompanyName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  status: {
    type: String,
  },
  EIN: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
  },
  lawfirmFee: {
    type: Number,
  },
  platform: {
    type: Boolean,
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

lawfirmModel.pre('save', async function (next) {
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

lawfirmModel.pre('findOneAndUpdate', logUpdate);
lawfirmModel.pre('updateMany', logUpdate);
lawfirmModel.pre('updateOne', logUpdate);

lawfirmModel.post('findOneAndUpdate', logUpdatePost);
lawfirmModel.post('updateMany', logUpdatePost);
lawfirmModel.post('updateOne', logUpdatePost);

export const Lawfirm = mongoose.model<ILawfirm>('Lawfirms', lawfirmModel);
