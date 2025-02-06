import mongoose, {Document} from 'mongoose';
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
  previousMessages: mongoose.Schema.Types.ObjectId[];
  userId: string;
  userName: string;
  isDeleted: boolean;
  isRead: boolean;
  type: string;
  medium: string;
  debtorCompanyName: string;
  creditorCompanyName: string;
  negotiatorName: string;
  attachments: Array<IKeyFile>; // Other Document Field i.e Lawsuit
  createdAt: string;
  updatedAt: string;
}
