import mongoose, {Schema} from 'mongoose';
import {ICase} from '../interfaces/case.interface';

const caseModel: Schema = new Schema({
  debtor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Debtors',
  },
  creditor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Creditors',
  },
  totalDebt: {
    type: Number,
    required: true,
  },
  lastPaymentDate: {
    type: Date,
  },
  paidAmount: {
    type: Number,
    required: true,
  },
  remaining: {
    type: Number,
    required: true,
  },
  documents: {
    type: [
      {
        key: {type: String, required: true},
        originalFileName: {type: String, required: true},
      },
    ],
  },

  paymentPlanStartDate: {
    type: Date,
    required: true,
  },
  intervals: {
    type: [
      {
        amount: {type: Number, required: true},
        startDate: {type: Date, required: true},
        frequency: {type: Number, required: true},
        frequencyProgress: {type: Number, default: 0},
        timePeriod: {type: String, required: true},
      },
    ],
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

export const Case = mongoose.model<ICase>('Cases', caseModel);
