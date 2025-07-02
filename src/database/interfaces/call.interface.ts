import mongoose, {Document} from 'mongoose';

export interface ICall extends Document {
  callSid: string;
  callLegId: string;
  callSessionId: string;
  caseId: mongoose.Schema.Types.ObjectId;
  debtorId: mongoose.Schema.Types.ObjectId;
  creditorId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  callerName: string;
  accountSid: string;
  callTo: string[];
  callFrom: string;
  callStartTime: string;
  callDirection: string;
  callDuration: number;
  callStatus: string;
  callRecordingSid: string;
  isDeleted: boolean;
  type: string;
  transcriptUrl: string;
  conferenceName: string;
  hangupSource: string;
  recordingUrl: string;
  sipHangupCause: string;
  createdAt: Date;
  updatedAt: Date;
}
