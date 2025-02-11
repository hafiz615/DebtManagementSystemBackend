import {Document} from 'mongoose';

export interface INotificationCount extends Document {
  userId: string;
  count: string;
  createdAt: string;
  updatedAt: string;
}
