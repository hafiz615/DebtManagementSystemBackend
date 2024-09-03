import mongoose, {Schema} from 'mongoose';
import {IJustification} from '../interfaces/justification.interface';

const JustificationSchema: Schema = new Schema({
  gemini: {
    type: Boolean,
  },
  llama: {
    type: Boolean,
  },
  chatGpt: {
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

export const Justification = mongoose.model<IJustification>(
  'justification',
  JustificationSchema
);
