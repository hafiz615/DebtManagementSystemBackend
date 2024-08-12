import {Document} from 'mongoose';

export interface IStrategy extends Document {
  caseId: string;
  name: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}
