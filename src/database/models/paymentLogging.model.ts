import mongoose, {Schema} from 'mongoose';
import {IPaymentLogging} from '../interfaces/paymentLogging.interface';
const paymentLogging: Schema = new Schema({
  cronId: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  caseId: {
    type: String,
  },
  debtor: {
    type: String,
  },
  failReason: {
    type: String,
  },
  successReason: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  creditor: {
    type: String,
  },
  firstChoiceCreditor: {
    type: String,
  },
  paymentType: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});
export const PaymentLogging = mongoose.model<IPaymentLogging>(
  'paymentLogging',
  paymentLogging
);
