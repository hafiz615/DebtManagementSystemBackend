import mongoose, {Schema} from 'mongoose';
import commonUtil from '../../utils/common.util';

export class Debtor {
  basicInformation = {
    fullName: '',
    email: '',
    SSID: '',
    country: '',
    state: '',
    city: '',
    zipCode: '',
    status: '',
    phone: '',
    address: '',
  };
  businessInformation = {
    companyName: '',
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
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
