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
  bulkUpload: boolean;
  weeklyBudgetUpdated: boolean;
  emailKey: string;
  strategy1MaxProfit: number;
  strategy3MaxProfit: number;
  strategy1BudgetCustom: number;
  strategy3BudgetCustom: number;
  weeklyBudgetKeyStrategy1: string;
  weeklyBudgetKeyStrategy3: string;
  weeklyBudgetStrategy1: number;
  weeklyBudgetStrategy3: number;
  profitMargin: number;
  moneyThumbAppId: number;
  createdAt: string;
  updatedAt: string;
}
