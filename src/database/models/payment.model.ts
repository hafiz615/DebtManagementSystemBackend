import mongoose, {Schema} from 'mongoose';
import {IPayment} from '../interfaces/payment.interface';
const PaymentModel: Schema = new Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cases',
  },
  authorized: {
    type: String,
    default: 'Pending',
  },
  captured: {
    type: String,
    default: 'Pending',
  },
  status: {
    type: String,
    default: 'Pending',
  },
  amount: {
    type: Number,
    default: 0,
  },
  dueDate: {
    type: Date,
  },
  frequency: {
    type: Number,
    default: 0,
  },
  intervalId: {
    type: String,
  },
  failedReasonAuthorization: {
    type: String,
  },
  failedReasonCaptured: {
    type: String,
  },
  rescheduled: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  retries: {
    type: Number,
  },
  commission: {
    type: Number,
  },
  creditorAmount: {
    type: Number,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

export const Payment = mongoose.model<IPayment>('Payments', PaymentModel);
