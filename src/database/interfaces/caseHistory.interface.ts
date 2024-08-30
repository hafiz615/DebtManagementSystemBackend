import {Document} from 'mongoose';

export interface ICaseHistory extends Document {
  caseId: string;
  caseHistory: Array<any>;
  createdAt: string;
  updatedAt: string;
}
