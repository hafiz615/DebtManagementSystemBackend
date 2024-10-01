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
    default: 'Upcoming',
  },
  sendViaPaynote: {
    type: String,
    default: 'Pending',
  },
  paynoteCheckId: {
    type: String,
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
  debtorId: {
    type: String,
  },
  failedReasonAuthorization: {
    type: String,
  },
  failedReasonCaptured: {
    type: String,
  },
  failedReasonPaynote: {
    type: String,
  },
  rescheduled: {
    type: Date,
  },
  debtorTransId: {
    type: String,
  },
  retriesAuth: {
    type: Number,
  },
  retriesCapture: {
    type: Number,
  },
  retriesPaynote: {
    type: Number,
  },
  timePeriod: {
    type: String,
  },
  paymentReference: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
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
