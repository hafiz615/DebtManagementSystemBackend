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
  creditorSecurityKey: '';
  contacts = Array<{
    name: '';
    title: '';
    phone: '';
    email: '';
    relationWithDebtor: '';
    country: '';
    state: '';
    city: '';
    zipCode: '';
  }>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
