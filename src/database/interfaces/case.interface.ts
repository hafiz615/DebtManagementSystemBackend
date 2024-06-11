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
  caseOwner: {name: string; id: string};
  negotiator: {name: string; id: string};
  manager: {name: string; id: string};
  caseCode: string;
  status: string;
  debtor: mongoose.Schema.Types.ObjectId;
  creditor: mongoose.Schema.Types.ObjectId;
  totalDebt: number;
  lastPayment: string;
  paidAmount: number;
  remaining: number;
  documents: Array<IKeyFile>;
  intervals: Array<IInterval>;
  createdAt: string;
  updatedAt: string;
}
