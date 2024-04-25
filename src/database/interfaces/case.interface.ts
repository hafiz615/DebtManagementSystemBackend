import mongoose, {Document} from 'mongoose';

interface documents {
  key: string;
  originalFileName: string;
}
export interface ICase extends Document {
  debtor: mongoose.Schema.Types.ObjectId;
  creditor: mongoose.Schema.Types.ObjectId;
  totalDebt: number;
  lastPayment: string;
  paidAmount: number;
  remaining: number;
  documents: Array<documents>;
  paymentPlanStartDate: string;
  intervals: Array<{
    amount: number;
    startDate: string;
    frequency: number;
    frequencyProgress: number;
    timePeriod: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
