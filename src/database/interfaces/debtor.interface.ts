import mongoose, {Document} from 'mongoose';

interface businessInformation {
  companyName: string;
  EIN: string;
  businessCategory: string;
  description: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  phone: string;
  address: string;
}

interface basicInformation {
  fullName: string;
  email: string;
  SSID: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  status: string;
  phone: string;
  address: string;
}
export interface IDebtor extends Document {
  basicInformation: basicInformation;
  businessInformation: businessInformation;
  contacts: Array<mongoose.Schema.Types.ObjectId>;
  transactionTypes: Array<{name: string; priority: string}>;
  customerVaultId: string;
  createdAt: string;
  updatedAt: string;
}
