import {Document} from 'mongoose';

export interface INotification extends Document {
  text: string;
  caseId: string;
  isRead: boolean;
  type: string;
  createdAt: string;
  updatedAt: string;
}
