import {Document} from 'mongoose';

export interface IPaymentLogging extends Document {
  cronId: string;
  paymentId: string;
  caseId: string;
  debtor: string;
  failReason: string;
  successReason: string;
  transactionId: string;
  creditor: string;
  firstChoiceCreditor: string;
  paymentType: string;
  createdAt: string;
}
