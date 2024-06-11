import mongoose, {Document} from 'mongoose';

export interface IPayment extends Document {
  caseId: mongoose.Schema.Types.ObjectId;
  debtorId: string;
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
  timePeriod: string;
  createdAt: string;
  updatedAt: string;
}
