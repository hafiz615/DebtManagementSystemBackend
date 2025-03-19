import {Document} from 'mongoose';

export interface IVoiceMail extends Document {
  callSid: string;
  callTo: string;
  callFrom: string;
  callRecordingSid: string;
  transcriptUrl: String;
  createdAt: Date;
  updatedAt: Date;
}
