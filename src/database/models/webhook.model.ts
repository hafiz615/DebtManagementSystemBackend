// models/Log.ts
import {Schema, model} from 'mongoose';
const logSchema = new Schema({
  data: Schema.Types.Mixed,
  createdAt: {type: Date},
});

const WebhookLog = model('webhook', logSchema);

export default WebhookLog;
