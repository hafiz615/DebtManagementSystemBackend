import {Document} from 'mongoose';

export interface ICall extends Document {
  callSid: string;
  caseId: string;
  debtorId: string;
  creditorId: string;
  userId: string;
  callerName: string;
  accountSid: string;
  callTo: string[];
  callFrom: string;
  callStartTime: string;
  callDirection: string;
  callDuration: string;
  callStatus: string;
  callRecordingSid: string;
  isDeleted: boolean;
  type: string;
  transcriptUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
