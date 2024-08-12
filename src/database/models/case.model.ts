import mongoose, {Schema} from 'mongoose';
import {ICase, INotes} from '../interfaces/case.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
    default: 'Customer',
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
    required: true,
  },
  remaining: {
    type: Number,
    required: true,
  },
  // documents: {
  //   type: Array<{
  //     key: {type: String; required: true};
  //     originalFileName: {type: String; required: true};
  //     url: {type: String; default: ''};
  //   }>,
  // },
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
    type: String,
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

caseModel.pre('findOneAndUpdate', logUpdate);
caseModel.pre('updateMany', logUpdate);
caseModel.pre('updateOne', logUpdate);

caseModel.post('findOneAndUpdate', logUpdatePost);
caseModel.post('updateMany', logUpdatePost);
caseModel.post('updateOne', logUpdatePost);

export const Case = mongoose.model<ICase>('Cases', caseModel);
