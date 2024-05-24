import {Document} from 'mongoose';

export interface ICustomField extends Document {
  name: string;
  type: string;
  target: string;
  description: string;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITargetCustomFields extends Document {
  target: string;
  customFields: Array<{name: string; value: any}>;
  createdAt: string;
  updatedAt: string;
}
