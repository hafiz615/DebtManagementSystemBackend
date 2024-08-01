import mongoose, {Schema} from 'mongoose';
import {IDebtor} from '../interfaces/debtor.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const debtorSchema: Schema = new Schema({
  basicInformation: {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    SSID: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    status: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    weeklyBudget: {
      type: Number,
    },
  },
  businessInformation: {
    companyName: {
      type: String,
      required: true,
    },
    EIN: {
      type: String,
      required: true,
    },
    businessCategory: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
  },
  contacts: {
    type: Array<{
      name: '';
      title: '';
      phone: '';
      email: '';
      relationWithDebtor: '';
      country: '';
      state: '';
      city: '';
      zipCode: '';
    }>,
  },
  documents: {
    type: Array<{
      key: {type: String; required: true};
      originalFileName: {type: String; required: true};
      url: {type: String; default: ''};
    }>,
  },
  paymentType: {
    type: String,
  },
  createdBy: {
    type: String,
  },
  customerVaultId: {
    type: String,
  },
  totalCommission: {
    type: Number,
    select: false,
  },
  commissionPaid: {
    type: Number,
    select: false,
  },
  weeklyCommission: {
    type: Number,
    select: false,
  },
  weeklyCommissionPaid: {
    type: Boolean,
    select: false,
  },
  weeklyCommissionDate: {
    type: Date,
    select: false,
  },
  commissionPaymentId: {
    type: String,
    // ref: 'Payments',
    select: false,
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

// Middleware for logging updates
const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
  console.log(this.model.modelName, 'this.model.modelName');
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

debtorSchema.pre('findOneAndUpdate', logUpdate);
debtorSchema.pre('updateMany', logUpdate);
debtorSchema.pre('updateOne', logUpdate);

debtorSchema.post('findOneAndUpdate', logUpdatePost);
debtorSchema.post('updateMany', logUpdatePost);
debtorSchema.post('updateOne', logUpdatePost);

export const Debtor = mongoose.model<IDebtor>('Debtors', debtorSchema);
