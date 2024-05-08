import mongoose from 'mongoose';
import commonUtil from '../../utils/common.util';

export class Creditor {
  basicInformation = {
    fullName: '',
    email: '',
    phone: '',
  };
  businessInformation = {
    companyName: '',
    businessCategory: '',
  };
  notes = '';
  lastFundedDate = '';
  historicalRange = {
    minimum: 0,
    maximum: 0,
  };
  contacts = Array<mongoose.Schema.Types.ObjectId>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
