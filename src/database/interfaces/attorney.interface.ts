import mongoose, {Document} from 'mongoose';

export interface IAttorney extends Document {
  lawfirmId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  SSN: string;
  state: string;
  status: string;
  isDeleted: boolean;
  attorneyFee: number;
  platform: boolean;
  logTrackingId: string;
  createdAt: Date;
  updatedAt: Date;
}
