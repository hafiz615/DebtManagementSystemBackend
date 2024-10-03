import mongoose, {Document} from 'mongoose';

export interface IDomainVerify extends Document {
  link: string;
  isVerified: boolean;
  from: string;
  createdAt: string;
  updatedAt: string;
}
