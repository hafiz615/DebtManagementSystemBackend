import mongoose, {Schema} from 'mongoose';
import {IChatSummary} from '../interfaces/chatSummary.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const SettlementRangeSchema = new Schema({
  chatId: {
    type: String,
  },
  prompt: {
    type: String,
  },
  chat: {
    type: Schema.Types.Mixed,
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

SettlementRangeSchema.pre('save', async function (next) {
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

SettlementRangeSchema.pre('findOneAndUpdate', logUpdate);
SettlementRangeSchema.pre('updateMany', logUpdate);
SettlementRangeSchema.pre('updateOne', logUpdate);

SettlementRangeSchema.post('findOneAndUpdate', logUpdatePost);
SettlementRangeSchema.post('updateMany', logUpdatePost);
SettlementRangeSchema.post('updateOne', logUpdatePost);

export const ChatSummary = mongoose.model<IChatSummary>(
  'chatSummary',
  SettlementRangeSchema
);
