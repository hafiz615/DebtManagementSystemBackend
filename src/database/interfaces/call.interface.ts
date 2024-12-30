import { Document } from 'mongoose';

export interface ICall extends Document {
    callSid: string ;
    caseId: string;
    callerName: string;
    accountSid: string;
    callTo: string;
    callFrom: string;
    callStartTime: Date;
    callDuration: string ;
    callStatus: string;
    callRecordingSid: string;
    transcriptUrl: string;
    createdAt: Date;
    updatedAt: Date;
  }