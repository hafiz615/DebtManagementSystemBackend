import mongoose, {Document} from 'mongoose';

export interface IKeyFile {
  key: string;
  originalFileName: string;
  url?: string;
}
interface businessInformation {
  companyName: string;
  EIN: string;
  businessCategory: string;
  description: string;
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
  state: string;
  city: string;
  zipCode: string;
  status: string;
  phone: string;
  address: string;
  weeklyBudget: number;
}
export interface IDebtor extends Document {
  basicInformation: basicInformation;
  businessInformation: businessInformation;
  contacts: Array<{
    name: string;
    title: string;
    phone: string;
    email: string;
    relationWithDebtor: string;
    state: string;
    city: string;
    zipCode: string;
  }>;
  documents: Array<IKeyFile>;
  createdBy: string;
  accounts: Array<{paymentType: string; customerVaultId: string}>;
  // paymentType: string;
  extractedFields: any;
  // customerVaultId: string;
  totalCommission: number;
  commissionPaid: number;
  weeklyCommission: number;
  weeklyCommissionPaid: boolean;
  weeklyCommissionDate: string;
  commissionPercentage: number;
  commissionPaymentId: string;
  weeklyBudgetUpdated: boolean;
  createdAt: string;
  updatedAt: string;
}
