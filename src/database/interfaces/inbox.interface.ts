import {Document} from 'mongoose';
import {IKeyFile} from './debtor.interface';

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
  attachments: Array<IKeyFile>; // Other Document Field i.e Lawsuit
  createdAt: string;
  updatedAt: string;
}
