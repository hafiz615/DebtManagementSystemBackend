import mongoose, {Schema} from 'mongoose';

export class Debtor {
  basicInformation = {
    fullName: '',
    email: '',
    SSID: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    status: 'Customer',
    phone: '',
    address: '',
  };
  businessInformation = {
    organizationName: '',
    EIN: '',
    businessCategory: '',
    description: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    phone: '',
    address: '',
  };
  contacts = Array<mongoose.Schema.Types.ObjectId>();
}
