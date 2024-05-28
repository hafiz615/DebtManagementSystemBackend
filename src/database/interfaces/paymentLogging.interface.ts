import {Document} from 'mongoose';

export interface IPaymentLogging extends Document {
  cronId: string;
  paymentId: string;
  caseId: string;
  userId: string;
  failReason: string;
  successReason: string;
  transactionId: string;
  createdAt: string;
}
