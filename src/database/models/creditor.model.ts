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
      enum: ['Customer', ' On hold', 'Canceled', 'Declared Bankrupcy'],
      default: 'Customer',
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
    },
  },
  businessInformation: {
    organizationName: {
      type: String,
      required: true,
    },
    EIN: {
      type: String,
      required: true,
      unique: true,
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
