import mongoose, {Schema} from 'mongoose';
import {IChatSummary} from '../interfaces/chatSummary.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const SettlementRangeSchema = new Schema({
  chatId: {
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
