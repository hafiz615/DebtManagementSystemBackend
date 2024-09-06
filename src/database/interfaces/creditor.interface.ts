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
  contacts: Array<{
    name: string;
    title: string;
    phone: string;
    email: string;
    relationWithCreditor: string;
    state: string;
    city: string;
    zipCode: string;
  }>;
  notes: string;
  lastFundedDate: string;
  historicalRange: {
    minimum: number;
    maximum: number;
  };
  // creditorSecurityKey: string;
  accountTitle: string;
  accountTitleMapping: Array<{
    caseId: string;
    accountTitle: string;
  }>;
  paynoteUserId: string;
  paynoteSourceId: string;
  // paymentType: string;
  // customerVaultId: string;
  aggression: number;
  createdAt: string;
  updatedAt: string;
}
