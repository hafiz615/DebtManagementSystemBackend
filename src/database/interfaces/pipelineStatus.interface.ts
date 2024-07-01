import {Document} from 'mongoose';

export interface IPipelineStatus extends Document {
  pipeline: string;
  status: Array<{name: string; type: string}>;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
