import mongoose, {Document} from 'mongoose';

export interface IPayment extends Document {
  caseId: mongoose.Schema.Types.ObjectId;
  debtorId: string;
  authorized: string;
  captured: string;
  status: string;
  debit: string;
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
  timePeriod: string;
  paymentReference: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
