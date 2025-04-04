import mongoose, {Document} from 'mongoose';

export interface INotification extends Document {
  text: string;
  caseId: string;
  inboxId: mongoose.Schema.Types.ObjectId;
  userId: string;
  debtorId: string;
  isRead: boolean;
  type: string;
  createdAt: string;
  updatedAt: string;
}
