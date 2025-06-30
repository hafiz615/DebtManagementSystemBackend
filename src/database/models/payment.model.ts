import mongoose, {Schema} from 'mongoose';
import {IPayment} from '../interfaces/payment.interface';
import {v4} from 'uuid';
import asyncLocalStorage from '../../utils/localStorage.util';
import PaymentLog from './paymentLogs.model';
import commonUtil from '../../utils/common.util';

const PaymentModel: Schema = new Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cases',
  },
  attorneyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attorneys',
  },
  lawsuitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawsuits',
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
  previousAmount: {
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
  logTrackingId: {
    type: String,
  },
  paymentReferenceBool: {
    type: Boolean,
  },
  commission: {
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
  transactionType: {
    type: String,
  },
  paymentMode: {
    type: String,
  },
  paymentGateway: {
    type: String,
  },
  manualCommission: {
    type: Number,
  },
  paymentLink: {
    type: String,
  },
  debtorName: {
    type: String,
  },
  authorizedDate: {
    type: Date,
  },
  serviceFee: {
    type: Number,
  },
  legalFee: {
    type: Number,
  },
  creditorName: String,
  calculateComission: {
    type: Boolean,
  },
  checkStatus: String,
  ach: Boolean,
  ccWaterfall: Boolean,
  achWaterfall: Boolean,
  nonExecutable: Boolean,
  ccVault: String,
});

PaymentModel.pre('save', async function (next) {
  this.logTrackingId = v4();
  next();
});

PaymentModel.pre('insertMany', async function (next, docs) {
  for (const doc of docs) {
    doc.logTrackingId = v4();
  }
  next();
});

// Middleware for logging updates
const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
  // Retrieve the document before update
  const previousDoc = await this.model.findOne(query);
  this.previousDoc = previousDoc;
  next();
};

const logUpdatePost = async function (doc) {
  let traceId = '',
    ip = '',
    userId = '',
    url = '',
    method = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    if (store.get('traceId')) traceId = store.get('traceId');
    if (store.get('ip')) ip = store.get('ip');
    if (store.get('userId')) userId = store.get('userId');
    if (store.get('url')) url = store.get('url');
    if (store.get('method')) method = store.get('method');
  }
  const previousDoc = this.previousDoc;
  const logEntry = new PaymentLog({
    traceId,
    previousData: previousDoc,
    currentData: doc,
    model: this.model.modelName,
    logTrackingId: previousDoc?.logTrackingId ?? '',
    ip,
    userId,
    url,
    method,
    createdAt: commonUtil.getCurrentDate(),
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
