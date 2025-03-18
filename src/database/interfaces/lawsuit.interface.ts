import mongoose, {Document} from 'mongoose';
import {IInterval} from './case.interface';

export interface ILawsuit extends Document {
  lawfirmId: mongoose.Schema.Types.ObjectId;
  attorneyId: mongoose.Schema.Types.ObjectId;
  debtorId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  creditorId: mongoose.Schema.Types.ObjectId;
  lawsuitResolved: boolean;
  lawsuitPaidAmount: number;
  lawsuitPaidCount: number;
  lawsuitReceiveAmount: number;
  lawsuitReceiveCount: number;
  lawfirmCompanyName: string;
  defendentCompanyName: string;
  plantiffCompanyName: string;
  logTrackingId: string;
  lawsuitDate: Date;
  balance: number;
  attorneyPaymentsProceed: boolean;
  intervals: Array<IInterval>;
  isExempt: boolean;
  createdAt: Date;
  updatedAt: Date;
}
