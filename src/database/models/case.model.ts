import mongoose, {Schema} from 'mongoose';
import {ICase, INotes} from '../interfaces/case.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';
import commonUtil from '../../utils/common.util';

const caseModel: Schema = new Schema({
  debtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debtors',
  },
  creditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creditors',
  },
  totalDebt: {
    type: Number,
  },
  lastPaymentDate: {
    type: Date,
  },
  paidAmount: {
    type: Number,
  },
  status: {
    type: String,
  },
  caseOwner: {
    type: String,
  },
  caseOwnerId: {
    type: String,
  },
  negotiator: {
    type: String,
  },
  negotiatorId: {
    type: String,
  },
  manager: {
    type: String,
  },
  managerId: {
    type: String,
  },
  caseCode: {
    type: String,
  },
  remaining: {
    type: Number,
  },
  remainingAmountPaid: {
    type: Number,
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
  contractDetails: {
    type: {},
  },
  feePayment: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
  },
  confidence: {
    type: Number,
  },
  closeDate: {
    type: Date,
  },
  notes: {
    type: Array<{
      userId: {type: String};
      value: {type: String};
      createdAt: {type: Date};
    }>,
  },
  chatId: {
    type: String,
  },
  isExempt: {
    type: Boolean,
  },
  strategyOne_1: {
    type: Boolean,
  },
  strategyOne_2: {
    type: Boolean,
  },
  strategyOne_3: {
    type: Boolean,
  },
  strategyTwo: {
    type: Boolean,
  },
  strategyThree: {
    type: Boolean,
  },
  justifications: {
    type: Boolean,
  },
  lumpSumJustifications: {
    type: Boolean,
  },
  fullProfitJustifications: {
    type: Boolean,
  },
  logTrackingId: {
    type: String,
  },
  settlementRange: {
    type: Boolean,
  },
  getCaseIdPercentage: {
    type: Boolean,
  },
  platform: {
    type: Boolean,
  },
  creditorPaymentsProceed: {
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
  // Interest Rate Fields
  paymentFrequency: {
    type: String, // Text field for frequency
  },
  impliedInterestRate: {
    type: Number, // Implied Interest rate per creditor
  },
  averageInterestRate: {
    type: Number, // Average interest rate
  },
  // Lawsuit Fields
  lawsuitFile: {
    type: Array<{
      key: {type: String; required: true};
      originalFileName: {type: String; required: true};
      url: {type: String; default: ''};
    }>,
  },
  hasLawsuits: {
    type: Boolean, // Do you have lawsuits?
  },
  lawsuitCreditorTags: {
    type: Array<String>, // Creditor dropdown tags
  },
  dateServed: {
    type: Date,
  },
  serviceFee: {
    type: Number,
  },
  legalFee: {
    type: Number,
  },
  affiliateLink: {
    type: String,
  },
  affiliateEmail: {
    type: String,
  },
  lawsuitExist: {
    type: Boolean,
  },
  lawfirmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawfirms',
  },
});

caseModel.pre('save', async function (next) {
  this.logTrackingId = v4();
  next();
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
  const logEntry = new UpdateLog({
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

caseModel.pre('findOneAndUpdate', logUpdate);
caseModel.pre('updateMany', logUpdate);
caseModel.pre('updateOne', logUpdate);

caseModel.post('findOneAndUpdate', logUpdatePost);
caseModel.post('updateMany', logUpdatePost);
caseModel.post('updateOne', logUpdatePost);

export const Case = mongoose.model<ICase>('Cases', caseModel);
