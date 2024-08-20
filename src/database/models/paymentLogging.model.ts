import mongoose, {Schema} from 'mongoose';
import {IPaymentLogging} from '../interfaces/paymentLogging.interface';
const paymentLogging: Schema = new Schema({
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
export const PaymentLogging = mongoose.model<IPaymentLogging>(
  'paymentLogging',
  paymentLogging
);
