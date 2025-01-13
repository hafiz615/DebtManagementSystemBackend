import {Document} from 'mongoose';

export interface IDraft extends Document {
  userId: string;
  caseId: string;
  from: string;
  to: string;
  cc: any;
  subject: string;
  content: string;
  caseCode: string;
  debtorCompanyName: string;
  creditorCompnayName: string;
  negotiatorName: string;
  createdAt: Date;
  updatedAt: Date;
}