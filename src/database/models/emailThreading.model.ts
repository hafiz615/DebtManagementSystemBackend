import mongoose, {Schema} from 'mongoose';
import {IEmailThreading} from '../interfaces/emailThreading.interface';
import commonUtil from '../../utils/common.util';
import {v4} from 'uuid';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const emailThreadingModel: Schema = new Schema({
  threadId: {
    type: String,
  },
  firstInboxMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'inbox',
  },
  previousMessages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'inbox',
    },
  ],
  isDeleted: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    default: commonUtil.getCurrentDate(),
  },
  updatedAt: {
    type: Date,
    default: commonUtil.getCurrentDate(),
  },
  logTrackingId: {
    type: String,
  },
});

// Pre-save hook to assign a logTrackingId
emailThreadingModel.pre('save', async function (next) {
  this.logTrackingId = v4();
  next();
});

// Generic log update middleware (runs before updates)
const logUpdate = async function (next) {
  const query = this.getQuery();
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

// toJSON transform to reorder fields
emailThreadingModel.set('toJSON', {
  transform: (doc, ret) => {
    const reordered = {
      _id: ret._id,
      ...ret,
    };
    return reordered;
  },
});

emailThreadingModel.pre('findOneAndUpdate', logUpdate);
emailThreadingModel.pre('updateMany', logUpdate);
emailThreadingModel.pre('updateOne', logUpdate);

emailThreadingModel.post('findOneAndUpdate', logUpdatePost);
emailThreadingModel.post('updateMany', logUpdatePost);
emailThreadingModel.post('updateOne', logUpdatePost);

export const EmailThreading = mongoose.model<IEmailThreading>(
  'EmailThreadings',
  emailThreadingModel
);
