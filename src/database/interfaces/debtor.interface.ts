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
    country: string;
    state: string;
    city: string;
    zipCode: string;
  }>;
  transactionTypes: Array<{name: string; priority: string}>;
  customerVaultId: string;
  totalCommission: number;
  commissionPaid: number;
  weeklyCommission: number;
  weeklyCommissionPaid: boolean;
  weeklyCommissionDate: string;
  commissionPaymentId: string;
  createdAt: string;
  updatedAt: string;
}
