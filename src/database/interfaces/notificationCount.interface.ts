import {Document} from 'mongoose';

export interface INotificationCount extends Document {
  userId: string;
  count: number;
  smsCount: number;
  emailCount: number;
  taskCount: number;
  callCount: number;
  missCallCount: number;
  rejectCallCount: number;
  createdAt: string;
  updatedAt: string;
}
