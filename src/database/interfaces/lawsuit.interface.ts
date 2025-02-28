import mongoose, {Document} from 'mongoose';

export interface ILawsuit extends Document {
  lawfirmId: mongoose.Schema.Types.ObjectId;
  attorneyId: mongoose.Schema.Types.ObjectId;
  debtorId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  creditorId: mongoose.Schema.Types.ObjectId;
  lawsuitStatus: boolean;
  lawsuitPaidAmount: number;
  lawsuitPaidCount: number;
  lawsuitReceiveCount: number;
  lawfirmCompanyName: string;
  defendentCompanyName: string;
  plantiffCompanyName: string;
  logTrackingId: string;
  lawsuitDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
