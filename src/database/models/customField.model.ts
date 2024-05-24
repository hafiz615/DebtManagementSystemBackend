import mongoose, {Schema} from 'mongoose';
import {ICustomField} from '../interfaces/customField.interface';

const customFieldsModel: Schema = new Schema({
  name: {
    type: String,
  },
  type: {
    type: String,
  },
  target: {
    type: String,
  },
  description: {
    type: String,
  },
  shared: {
    type: Boolean,
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

customFieldsModel.index({name: 1, target: 1}, {unique: true});

export const CustomFiled = mongoose.model<ICustomField>(
  'CustomFields',
  customFieldsModel
);
