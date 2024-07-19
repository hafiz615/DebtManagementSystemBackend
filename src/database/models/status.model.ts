import mongoose, {Schema} from 'mongoose';
import {IStatus} from '../interfaces/status.interface';

const status: Schema = new Schema({
  status: {
    type: Array<String>,
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

export const Status = mongoose.model<IStatus>('status', status);
