import mongoose from 'mongoose';

export interface IWaterfall {
  _id?: string;
  debtorId: mongoose.Schema.Types.ObjectId;
  paymentId: mongoose.Schema.Types.ObjectId;
  execute: boolean;
  createdAt: Date;
  updatedAt: Date;
}
