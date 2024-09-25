import mongoose, {Document} from 'mongoose';

export interface IBulkUpload extends Document {
  debtor: mongoose.Schema.Types.ObjectId;
  status: string;
  retries: number;
  driveUrl: string;
  errorMessage: string;
  createdByName: string;
  createdById: string;
  caseIds: Array<string>;
  time: Array<string>;
  createdAt: string;
  updatedAt: string;
}
