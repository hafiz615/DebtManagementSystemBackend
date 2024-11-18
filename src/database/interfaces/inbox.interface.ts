import {Document} from 'mongoose';

export interface IInbox extends Document {
  from: string;
  to: string;
  cC: string;
  subject: string;
  name: string;
  text: string;
  textAsHtml: string;
  caseCode: string;
  isRead: boolean;
  type: string;
  debitorCompanyName: string;
  creditorCompnayName: string;
  negotiatorName: string;
  createdAt: string;
  updatedAt: string;
}
