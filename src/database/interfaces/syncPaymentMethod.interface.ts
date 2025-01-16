import {Document} from 'mongoose';

export interface ISyncPaymentMethod extends Document {
  syncId: string;
  email: string;
  platform: string;
  customerVaultId: string;
  createdAt: string;
  updatedAt: string;
}
