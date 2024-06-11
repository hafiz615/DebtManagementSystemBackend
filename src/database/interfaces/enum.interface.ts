import {Document} from 'mongoose';

export interface IEnum extends Document {
  enumTarget: string;
  enumList: Array<string>;
  createdAt: string;
  updatedAt: string;
}
