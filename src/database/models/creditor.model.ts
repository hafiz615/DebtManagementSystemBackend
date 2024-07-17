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
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
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
    accountTitle: {
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
  notes: {
    type: String,
  },
  lastFundedDate: {
    type: Date,
    required: true,
  },
  historicalRange: {
    minimum: {
      type: Number,
      required: true,
    },
    maximum: {
      type: Number,
      required: true,
    },
  },
  creditorSecurityKey: {
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
});

export const Creditor = mongoose.model<ICreditor>('Creditors', creditorModel);
