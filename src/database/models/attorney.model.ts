import mongoose, {Schema} from 'mongoose';
import {IAttorney} from '../interfaces/attorney.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const attorneyModel: Schema = new Schema({
  lawfirmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawfirms',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  name: {
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
  SSN: {
    type: String,
  },
  state: {
    type: String,
  },
  status: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
  },
  attorneyFee: {
    type: Number,
  },
  platform: {
    type: Boolean,
  },
  paynoteUserId: {
    type: String,
  },
  paynoteSourceId: {
    type: String,
  },
  paynoteSourceVerified: {
    type: Boolean,
  },
  paynoteUserFound: {
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

attorneyModel.pre('save', async function (next) {
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
    createdAt: commonUtil.getCurrentDate(),
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

attorneyModel.pre('findOneAndUpdate', logUpdate);
attorneyModel.pre('updateMany', logUpdate);
attorneyModel.pre('updateOne', logUpdate);

attorneyModel.post('findOneAndUpdate', logUpdatePost);
attorneyModel.post('updateMany', logUpdatePost);
attorneyModel.post('updateOne', logUpdatePost);

export const Attorney = mongoose.model<IAttorney>('Attorneys', attorneyModel);
