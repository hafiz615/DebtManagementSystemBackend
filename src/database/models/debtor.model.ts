import mongoose, {Schema} from 'mongoose';
import {IDebtor} from '../interfaces/debtor.interface';

const debtorModel: Schema = new Schema({
  basicInformation: {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    SSID: {
      type: String,
      required: true,
      unique: true,
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
      enum: ['Customer', 'On hold', 'Canceled', 'Declared Bankrupcy'],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
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
      unique: true,
    },
    address: {
      type: String,
    },
  },
  contacts: {
    type: Array<mongoose.Schema.Types.ObjectId>,
    ref: 'Contacts',
  },
  transactionTypes: {
    type: Array<{name: ''; priority: ''}>,
  },
  customerVaultId: {
    type: String,
  },
  totalCommission: {
    type: Number,
  },
  commissionPaid: {
    type: Boolean,
  },
  weeklyCommission: {
    type: Number,
  },
  weeklyCommissionPaid: {
    type: Boolean,
  },
  weeklyCommissionDate: {
    type: Boolean,
  },
  commissionPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payments',
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

export const Debtor = mongoose.model<IDebtor>('Debtors', debtorModel);
