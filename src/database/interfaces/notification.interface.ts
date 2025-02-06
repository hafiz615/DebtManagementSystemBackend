import {Document} from 'mongoose';

export interface INotification extends Document {
  text: string;
  caseId: string;
  inboxId: string;
  debtorId: string;
  isRead: boolean;
  type: string;
  createdAt: string;
  updatedAt: string;
}
