import { Document } from 'mongoose';

export interface ICall extends Document {
    callSid: string | null;
    caseId: string;
    callerName: string;
    accountSid: string | null;
    callTo: string;
    callFrom: string;
    callStartTime: string;
    callDuration: string | null;
    callStatus: string | null;
    callRecordingSid: string;
    transcriptUrl: string;
    createdAt: string;
    updatedAt: string;
  }