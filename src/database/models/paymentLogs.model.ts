// models/Log.ts
import {Schema, model} from 'mongoose';
import commonUtil from '../../utils/common.util';

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
  createdAt: {type: Date},
});

const PaymentLog = model('PaymentLog', logSchema);

export default PaymentLog;
