import {Document} from 'mongoose';

export interface IInbox extends Document {
  from: string;
  to: string;
  cc: any;
  subject: string;
  text: string;
  textAsHtml: string;
  caseCode: string;
  caseId: string;
  threadId: string;
  userId: string;
  userName: string;
  isRead: boolean;
  type: string;
  debtorCompanyName: string;
  creditorCompnayName: string;
  negotiatorName: string;
  createdAt: string;
  updatedAt: string;
}
