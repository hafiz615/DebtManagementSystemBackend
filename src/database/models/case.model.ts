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
  status: {
    type: String,
    required: true,
  },
  caseOwner: {
    type: String,
    required: true,
  },
  caseCode: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
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
        url: {type: String, default: ''},
      },
    ],
  },
  intervals: {
    type: [
      {
        amount: {type: Number, required: true},
        startDate: {type: Date, required: true},
        frequency: {type: Number, default: 0},
        timePeriod: {type: String, required: true},
      },
    ],
  },
  customFields: {
    type: Array<{
      name: {type: String};
      value: {type: Schema.Types.Mixed};
    }>,
  },
  commissionPaidAlready: {
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

export const Case = mongoose.model<ICase>('Cases', caseModel);
