import {Document} from 'mongoose';

export interface IServiceFee extends Document {
  serviceFee: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
