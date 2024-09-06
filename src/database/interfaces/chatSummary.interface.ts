import {Document} from 'mongoose';

export interface IChatSummary extends Document {
  chatId: string;
  prompt: string;
  chat: any;
  createdAt: string;
  updatedAt: string;
}
