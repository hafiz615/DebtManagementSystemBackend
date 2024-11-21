import {Document} from 'mongoose';

export interface INotificationCount extends Document {
  count: string;
  createdAt: string;
  updatedAt: string;
}
