import mongoose, {Schema, model, Document} from 'mongoose';
import {ICall} from '../interfaces/call.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const callSchema: Schema = new Schema({
  callSid: {type: String}, // call_control_id
  callLegId: {type: String},
  caseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Cases'},
  creditorId: {type: mongoose.Schema.Types.ObjectId, ref: 'Creditors'},
  debtorId: {type: mongoose.Schema.Types.ObjectId, ref: 'Debtors'},
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
  callerName: {type: String, default: 'Unknown'},
  accountSid: {type: String}, // connectionId
  callTo: [{type: String}],
  callFrom: {type: String},
  callStartTime: {type: Date},
  callEndTime: {type: Date},
  callDirection: {type: Number},
  callDuration: {type: String},
  callStatus: {type: String},
  isDeleted: {
    type: Boolean,
    default: false,
  },
  callRecordingSid: {type: String},
  transcriptUrl: {type: String},
  type: {type: String, default: 'Call'},
  conferenceName: {type: String},
  createdAt: {type: Date, required: true},
  updatedAt: {type: Date, required: true},
});

// Automatically update `updatedAt` field
callSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

callSchema.pre('findOneAndUpdate', function (next) {
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
    createdAt: commonUtil.getCurrentDate(),
  });

  logEntry.save().catch(err => {
    console.error('Error saving log entry:', err);
  });
};

// Add hooks for logging
callSchema.pre('findOneAndUpdate', logUpdate);
callSchema.post('findOneAndUpdate', logUpdatePost);

export const Call = mongoose.model<ICall>('Call', callSchema);
