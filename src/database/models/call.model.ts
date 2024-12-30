import mongoose, { Schema, model, Document } from 'mongoose';
import { ICall } from '../interfaces/call.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import { v4 } from 'uuid';

const callSchema: Schema = new Schema({
  callSid: { type: String, default: null },
  caseId: { type: String, required: true },
  callerName: { type: String, required: true },
  accountSid: { type: String, default: null },
  callTo: { type: String, required: true },
  callFrom: { type: String, required: true },
  callStartTime: { type: String, default: '' },
  callDuration: { type: String, default: null },
  callStatus: { type: String, default: null },
  callRecordingSid: { type: String, default: ''},
  transcriptUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Automatically update `updatedAt` field
callSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

callSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Log tracking before update
const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
  const previousDoc = await this.model.findOne(query);
  this.previousDoc = previousDoc;
  next();
};

// Log tracking after update
const logUpdatePost = async function (doc) {
  let traceId = '',
    ip = '',
    userId = '',
    url = '',
    method = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    traceId = store.get('traceId') || '';
    ip = store.get('ip') || '';
    userId = store.get('userId') || '';
    url = store.get('url') || '';
    method = store.get('method') || '';
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

  logEntry.save().catch((err) => {
    console.error('Error saving log entry:', err);
  });
};

// Add hooks for logging
callSchema.pre('findOneAndUpdate', logUpdate);
callSchema.post('findOneAndUpdate', logUpdatePost);

export const Call = mongoose.model<ICall>('Call', callSchema);
