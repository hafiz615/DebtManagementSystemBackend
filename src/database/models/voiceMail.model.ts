import mongoose, {Schema} from 'mongoose';
import {IVoiceMail} from '../interfaces/voiceMail.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const voiceMailSchema: Schema = new Schema({
  callSid: {type: String},
  callTo: {type: String},
  callFrom: {type: String},
  callRecordingSid: {type: String},
  transcriptUrl: {type: String},
  createdAt: {type: Date, required: true},
  updatedAt: {type: Date, required: true},
});

// Automatically update `updatedAt` field
voiceMailSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

voiceMailSchema.pre('findOneAndUpdate', function (next) {
  this.set({updatedAt: new Date()});
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

  logEntry.save().catch(err => {
    console.error('Error saving log entry:', err);
  });
};

// Add hooks for logging
voiceMailSchema.pre('findOneAndUpdate', logUpdate);
voiceMailSchema.post('findOneAndUpdate', logUpdatePost);

export const VoiceMail = mongoose.model<IVoiceMail>(
  'VoiceMail',
  voiceMailSchema
);
