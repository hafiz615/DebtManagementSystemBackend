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
  // creditorSecurityKey = '';
  paynoteUserId = '';
  paynoteSourceId = '';
  accountTitle = '';
  accountTitleMapping = Array<{caseId: ''; accountTitle: ''}>();
  // paymentType = '';
  // customerVaultId = '';
  contacts = Array<{
    name: '';
    title: '';
    phone: '';
    email: '';
    relationWithCreditor: '';
    country: '';
    state: '';
    city: '';
    zipCode: '';
  }>();
  aggression = 0;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
