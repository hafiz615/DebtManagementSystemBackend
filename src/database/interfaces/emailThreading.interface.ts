import mongoose, {Document} from 'mongoose';

export interface IEmailThreading extends Document {
  threadId: string;
  userId: mongoose.Schema.Types.ObjectId;
  firstInboxMessage: mongoose.Schema.Types.ObjectId;
  previousMessages: mongoose.Schema.Types.ObjectId[];
  notificationStatus: boolean;
  followUpDate: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
