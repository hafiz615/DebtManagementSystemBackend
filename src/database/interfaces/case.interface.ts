import mongoose, {Document} from 'mongoose';

export interface IKeyFile {
  key: string;
  originalFileName: string;
  url?: string;
}

export interface IInterval {
  amount: number;
  startDate: string;
  frequency: number;
  timePeriod: string;
}
export interface ICase extends Document {
  caseOwner: string;
  caseCode: string;
  createdBy: string;
  status: string;
  debtor: mongoose.Schema.Types.ObjectId;
  creditor: mongoose.Schema.Types.ObjectId;
  totalDebt: number;
  lastPayment: string;
  paidAmount: number;
  remaining: number;
  documents: Array<IKeyFile>;
  intervals: Array<IInterval>;
  weeklyBudget: number;
  commissionPaidAlready: boolean;
  commissionCalculated: number;
  commissionPaying: number;
  createdAt: string;
  updatedAt: string;
}
