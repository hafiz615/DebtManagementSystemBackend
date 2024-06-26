import mongoose, {Schema} from 'mongoose';
import {IPipelineStatus} from '../interfaces/pipelineStatus.interface';

const pipelineStatus: Schema = new Schema({
  pipeline: {
    type: String,
  },
  status: {
    type: Array<{name: ''; type: ''}>,
  },
  description: {
    type: String,
  },
  userId: {
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

export const PipelineStatus = mongoose.model<IPipelineStatus>(
  'pipelineStatus',
  pipelineStatus
);
