import mongoose, {Schema} from 'mongoose';
import {IEnum} from '../interfaces/enum.interface';

const enumModel: Schema = new Schema({
  enumTarget: {
    type: String,
  },
  enumList: {
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

export const EnumModel = mongoose.model<IEnum>('enums', enumModel);
