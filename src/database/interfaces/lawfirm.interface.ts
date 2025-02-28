import mongoose, {Document} from 'mongoose';

export interface ILawfirm extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  lawfirmCompanyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  status: string;
  EIN: string;
  isDeleted: boolean;
  lawfirmFee: number;
  platform: boolean;
  paynoteUserId: string;
  paynoteSourceId: string;
  paynoteSourceVerified: boolean;
  paynoteUserFound: boolean;
  logTrackingId: string;
  createdAt: Date;
  updatedAt: Date;
}
