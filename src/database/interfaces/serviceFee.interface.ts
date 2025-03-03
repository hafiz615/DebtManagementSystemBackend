import {Document} from 'mongoose';

export interface IFee extends Document {
  type: string;
  fee: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
