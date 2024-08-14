// models/Log.ts
import {Schema, model} from 'mongoose';

const logSchema = new Schema({
  traceId: String,
  previousData: Schema.Types.Mixed,
  currentData: Schema.Types.Mixed,
  model: String,
  logTrackingId: String,
  ip: String,
  userId: String,
  url: String,
  method: String,
});

const UpdateLog = model('UpdateLog', logSchema);

export default UpdateLog;
