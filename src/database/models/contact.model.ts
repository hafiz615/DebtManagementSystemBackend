import mongoose, {Schema} from 'mongoose';
import {IContact} from '../interfaces/contact.interface';

const contactModel: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    // unique: true,
  },
  email: {
    type: String,
    // unique: true,
    required: true,
  },
  relationWithDebtor: {
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
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

export const Contact = mongoose.model<IContact>('Contacts', contactModel);
