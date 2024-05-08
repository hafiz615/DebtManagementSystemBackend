import mongoose, {Document} from 'mongoose';

interface businessInformation {
  companyName: string;
  businessCategory: string;
}

interface basicInformation {
  fullName: string;
  email: string;
  phone: string;
}
export interface ICreditor extends Document {
  basicInformation: basicInformation;
  businessInformation: businessInformation;
  contacts: Array<mongoose.Schema.Types.ObjectId>;
  notes: string;
  lastFundedDate: string;
  historicalRange: {
    minimum: number;
    maximum: number;
  };
  createdAt: string;
  updatedAt: string;
}
