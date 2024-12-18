import {Document} from 'mongoose';

export interface ISyncCreditor extends Document {
  creditorId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
