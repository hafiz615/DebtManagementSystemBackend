import mongoose, {Schema} from 'mongoose';
import {IUser} from '../interfaces/user.interface';
import commonUtil from '../../utils/common.util';

const userModel: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  token: {
    type: String,
    select: false,
  },
  password: {
    type: String,
    select: false,
  },
  role: {
    type: String,
    required: true,
  },
  isActive: {type: Boolean},
  createdBy: {type: String},
  SSID: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  phone: {
    type: String,
  },
  gender: {
    type: String,
  },
  address: {
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
userModel.index({_id: 1, email: 1});
userModel.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    this.password = await commonUtil.hashPassword(String(this.password));
    next();
  } catch (err) {
    console.log('Something went wrong while hashing passowrd', err);
    next(err as Error);
  }
});

export const User = mongoose.model<IUser>('Users', userModel);
