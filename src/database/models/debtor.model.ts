import mongoose, {Schema} from 'mongoose';
import {IDebtor} from '../interfaces/debtor.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

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
    type: [
      {
        name: String,
        title: String,
        phone: String,
        email: String,
        relationWithDebtor: String,
        state: String,
        city: String,
        zipCode: String,
      },
    ],
  },
  documents: {
    type: Array<{
      key: {type: String; required: true};
      originalFileName: {type: String; required: true};
      url: {type: String; default: ''};
    }>,
  },
  accounts: {
    type: Array<{paymentType: String; customerVaultId: String}>,
  },
  // paymentType: {
  //   type: String,
  // },
  createdBy: {
    type: String,
  },
  // customerVaultId: {
  //   type: String,
  // },
  extractedFields: {
    type: Schema.Types.Mixed,
  },
  totalCommission: {
    type: Number,
    select: false,
  },
  commissionPercentage: {
    type: Number,
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
  logTrackingId: {
    type: String,
  },
  driveUrl: {
    type: String,
  },
  bulkUpload: {
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

debtorSchema.pre('save', async function (next) {
  this.logTrackingId = v4();
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
