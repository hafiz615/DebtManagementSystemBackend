import mongoose, {Schema} from 'mongoose';
import {ICreditor} from '../interfaces/creditor.interface';

const creditorModel: Schema = new Schema({
  basicInformation: {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  businessInformation: {
    companyName: {
      type: String,
      required: true,
    },
    businessCategory: {
      type: String,
      required: true,
    },
  },
  contacts: {
    type: Array<{
      name: '';
      title: '';
      phone: '';
      email: '';
      relationWithCreditor: '';
      country: '';
      state: '';
      city: '';
      zipCode: '';
    }>,
  },
  notes: {
    type: String,
  },
  lastFundedDate: {
    type: Date,
    required: false,
  },
  historicalRange: {
    minimum: {
      type: Number,
      required: false,
    },
    maximum: {
      type: Number,
      required: true,
    },
  },
  creditorSecurityKey: {
    type: String,
  },
  accountTitle: {
    type: String,
  },
  accountTitleMapping: {
    type: Array<{
      caseId: '';
      accountTitle: '';
    }>,
  },
  paymentType: {
    type: String,
  },
  customerVaultId: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
  aggression: {
    type: Number,
  },
});

export const Creditor = mongoose.model<ICreditor>('Creditors', creditorModel);
