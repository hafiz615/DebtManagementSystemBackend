import mongoose, {Document} from 'mongoose';

export interface IEmailThreading extends Document {
  threadId: string;
  firstInboxMessage: mongoose.Schema.Types.ObjectId;
  previousMessages: mongoose.Schema.Types.ObjectId[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
