import mongoose, {Document} from 'mongoose';

export interface IPayment extends Document {
  caseId: mongoose.Schema.Types.ObjectId;
  authorized: string;
  captured: string;
  status: string;
  amount: number;
  dueDate: string;
  frequency: number;
  intervalId: string;
  failedReasonAuthorization: string;
  failedReasonCaptured: string;
  rescheduled: string;
  debtorTransId: string;
  retriesAuth: number;
  retriesCapture: number;
  commission: number;
  calculatedCommision: number;
  commissionTransId: string;
  timePeriod: string;
  createdAt: string;
  updatedAt: string;
}
