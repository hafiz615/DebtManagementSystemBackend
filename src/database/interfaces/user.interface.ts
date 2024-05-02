import {Document} from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  token: string;
  role: string;
  isActive: boolean;
  SSID: string;
  dateOfBirth: string;
  phone: string;
  gender: string;
  address: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
