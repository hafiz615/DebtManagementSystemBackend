// models/Log.ts
import {Schema, model} from 'mongoose';

const logSchema = new Schema({
  traceId: String,
  ip: String,
  url: String,
  method: String,
  requestPayload: Schema.Types.Mixed,
  responsePayload: Schema.Types.Mixed,
  responseStatus: Number,
  userId: String,
  timeTaken: Number,
  calledAt: {type: Date},
});

const Log = model('Log', logSchema);

export default Log;
