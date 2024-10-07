import mongoose, {Document} from 'mongoose';

export interface IDomainVerify extends Document {
  link: string;
  isVerified: boolean;
  from: string;
  subject: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}
