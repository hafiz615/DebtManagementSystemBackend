import mongoose, {Schema} from 'mongoose';
import {ITargetCustomFields} from '../interfaces/customField.interface';

const targetCustomFields: Schema = new Schema({
  target: {
    type: String,
  },
  customFields: {
    type: Array<{
      name: {type: String};
      value: {type: Schema.Types.Mixed};
    }>,
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

export const TargetCustomFields = mongoose.model<ITargetCustomFields>(
  'targetcustomfields',
  targetCustomFields
);
