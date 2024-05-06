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
  createdAt: string;
  updatedAt: string;
}
