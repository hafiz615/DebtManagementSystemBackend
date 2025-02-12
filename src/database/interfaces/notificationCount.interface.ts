import {Document} from 'mongoose';

export interface INotificationCount extends Document {
  userId: string;
  count: number;
  smsCount: number;
  emailCount: number;
  createdAt: string;
  updatedAt: string;
}
