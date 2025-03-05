import mongoose, {Document} from 'mongoose';
import {IInterval} from './case.interface';

export interface IKeyFile {
  key: string;
  originalFileName: string;
  url?: string;
}
interface businessInformation {
  companyName: string;
  EIN: string;
  businessCategory: string;
  // description: string;
  state: string;
  city: string;
  zipCode: string;
  // phone: string;
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
    // relationWithDebtor: string;
    // state: string;
    // city: string;
    // zipCode: string;
  }>;
  documents: Array<IKeyFile>;
  mcaDocuments: Array<IKeyFile>; // MCA's Document Field
  bankStatementDocuments: Array<IKeyFile>; // BankStatment Document Field
  otherDocuments: Array<IKeyFile>; // Other Document Field i.e Lawsuit
  lawsuitDocuments: Array<IKeyFile>; // Other Document Field i.e Lawsuit
  createdBy: string;
  accounts: Array<{
    paymentType: string;
    customerVaultId: string;
    platform: string;
  }>;
  // paymentType: string;
  extractedFields: any;
  lawsuitFields: any;
  // customerVaultId: string;
  totalCommission: number;
  commissionPaid: number;
  // weeklyCommission: number;
  // weeklyCommissionPaid: boolean;
  // weeklyCommissionDate: string;
  commissionPercentage: number;
  bulkUpload: boolean;
  weeklyBudgetUpdated: boolean;
  strategy1MaxProfit: number;
  strategy3MaxProfit: number;
  strategy1BudgetCustom: number;
  strategy3BudgetCustom: number;
  weeklyBudgetKeyStrategy1: string;
  weeklyBudgetKeyStrategy3: string;
  weeklyBudgetStrategy1: number;
  weeklyBudgetStrategy3: number;
  // profitMargin: number;
  moneyThumbAppId: number;
  appid: number;
  totalStatements: number;
  percentageChange: boolean;
  percentageChangeDate: string;
  userId: string;
  platform: boolean;
  trueProfit: number;
  videoUrl: string;
  intervals: Array<IInterval>;
  isExempt: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}
