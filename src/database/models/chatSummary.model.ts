import mongoose, {Schema} from 'mongoose';
import {IChatSummary} from '../interfaces/chatSummary.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

const SettlementRangeSchema = new Schema({
  chatId: {
    type: String,
  },
  prompt: {
    type: String,
  },
  settlement_range_1: {
    lower_bound: {
      type: Number,
    },
    upper_bound: {
      type: Number,
    },
    weeks_to_payoff_lower_bound: {
      type: Number,
    },
    weeks_to_payoff_upper_bound: {
      type: Number,
    },
    reason: {
      type: String,
    },
  },
  settlement_range_2: {
    lower_bound: {
      type: Number,
    },
    upper_bound: {
      type: Number,
    },
    weeks_to_payoff_lower_bound: {
      type: Number,
    },
    weeks_to_payoff_upper_bound: {
      type: Number,
    },
    reason: {
      type: String,
    },
  },
  settlement_range_3: {
    lower_bound: {
      type: Number,
    },
    upper_bound: {
      type: Number,
    },
    weeks_to_payoff_lower_bound: {
      type: Number,
    },
    weeks_to_payoff_upper_bound: {
      type: Number,
    },
    reason: {
      type: String,
    },
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
