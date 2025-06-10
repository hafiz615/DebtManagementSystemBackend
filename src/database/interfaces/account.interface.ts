import mongoose from 'mongoose';
export interface IAccount {
  _id?: string;
  debtorId: mongoose.Schema.Types.ObjectId;
  paymentType: string;
  platform: string;
  vault: string;
  priority: number;
  paynoteSourceId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
