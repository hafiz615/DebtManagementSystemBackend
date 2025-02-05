import {Document} from 'mongoose';

export interface INotificationCount extends Document {
  type: string;
  count: string;
  createdAt: string;
  updatedAt: string;
}
