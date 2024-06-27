import {Document} from 'mongoose';

export interface IStatus extends Document {
  status: Array<string>;
  createdAt: string;
  updatedAt: string;
}
