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

export const Debtor = mongoose.model<IDebtor>('Debtors', debtorModel);
