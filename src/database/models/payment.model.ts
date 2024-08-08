import mongoose, {Schema} from 'mongoose';
import {IPayment} from '../interfaces/payment.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
  debit: {
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

const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
  // Retrieve the document before update
  const previousDoc = await this.model.findOne(query);
  this.previousDoc = previousDoc;
  next();
};

const logUpdatePost = async function (doc) {
  let traceId = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    traceId = store.get('traceId');
  }
  const previousDoc = this.previousDoc;
  const logEntry = new UpdateLog({
    traceId: traceId,
    previousData: previousDoc,
    currentData: doc,
    model: this.model.modelName,
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

PaymentModel.pre('findOneAndUpdate', logUpdate);
PaymentModel.pre('updateMany', logUpdate);
PaymentModel.pre('updateOne', logUpdate);

PaymentModel.post('findOneAndUpdate', logUpdatePost);
PaymentModel.post('updateMany', logUpdatePost);
PaymentModel.post('updateOne', logUpdatePost);

export const Payment = mongoose.model<IPayment>('Payments', PaymentModel);
