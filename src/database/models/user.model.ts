import mongoose, {Schema} from 'mongoose';
import {IUser} from '../interfaces/user.interface';
import commonUtil from '../../utils/common.util';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

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
  verifyToken: {
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
  sessionIds: {
    type: Array<String>,
    select: false,
  },
  isDeleted: {type: Boolean},
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

userModel.pre('findOneAndUpdate', logUpdate);
userModel.pre('updateMany', logUpdate);
userModel.pre('updateOne', logUpdate);

userModel.post('findOneAndUpdate', logUpdatePost);
userModel.post('updateMany', logUpdatePost);
userModel.post('updateOne', logUpdatePost);

export const User = mongoose.model<IUser>('Users', userModel);
