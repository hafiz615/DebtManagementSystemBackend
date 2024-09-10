import {Document} from 'mongoose';

export interface IStrategy extends Document {
  caseId: string;
  name: string;
  data: any;
  updatedAt: string;
}
