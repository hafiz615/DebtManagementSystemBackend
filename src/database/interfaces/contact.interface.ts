import {Document} from 'mongoose';

export interface IContact extends Document {
  name: string;
  title: string;
  phone: string;
  email: string;
  relationWithDebtor: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
}
