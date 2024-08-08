import mongoose, {Date, Document} from 'mongoose';

// export interface IKeyFile {
//   key: string;
//   originalFileName: string;
//   url?: string;
// }

export interface IInterval {
  amount: number;
  startDate: string;
  frequency: number;
  timePeriod: string;
}
export interface INotes {
  userId: string;
  value: string;
  createdAt: string;
}
export interface ICase extends Document {
  caseOwner: string;
  negotiator: string;
  manager: string;
  caseOwnerId: string;
  negotiatorId: string;
  managerId: string;
  caseCode: string;
  status: string;
  debtor: mongoose.Schema.Types.ObjectId;
  creditor: mongoose.Schema.Types.ObjectId;
  totalDebt: number;
  lastPayment: string;
  feePayment: string;
  paidAmount: number;
  remaining: number;
  // documents: Array<IKeyFile>;
  intervals: Array<IInterval>;
  contractDetails: {};
  isDeleted: boolean;
  confidence: number;
  closeDate: string;
  notes: Array<{userId: string; value: string; createdAt: string}>;
  chatId: string;
  createdAt: string;
  updatedAt: string;
}
