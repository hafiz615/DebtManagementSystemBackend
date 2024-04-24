import mongoose, {Document} from 'mongoose';

export interface ICase extends Document {
  debtor: mongoose.Schema.Types.ObjectId;
  creditor: mongoose.Schema.Types.ObjectId;
  totalDebt: number;
  lastPayment: string;
  paidAmount: number;
  remaining: number;
  documents: Array<string>;
  paymentPlanStartDate: string;
  intervals: Array<{
    amount: number;
    startDate: string;
    frequency: number;
    frequencyProgress: number;
    timePeriod: string;
  }>;
}
