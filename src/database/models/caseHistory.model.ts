import mongoose, {Schema} from 'mongoose';
import {IUser} from '../interfaces/user.interface';
import {ICaseHistory} from '../interfaces/caseHistory.interface';

const caseHistorySchema: Schema = new Schema({
  caseHistory: {
    type: Array<Schema.Types.Mixed>,
  },
  caseId: {type: String},
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

export const CaseHistory = mongoose.model<ICaseHistory>(
  'caseHistory',
  caseHistorySchema
);
