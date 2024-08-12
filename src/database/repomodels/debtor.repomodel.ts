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
    weeklyBudget: 0,
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
  accounts = Array<{paymentType: ''; customerVaultId: ''}>();
  // paymentType = '';
  // customerVaultId = '';
  createdBy = '';
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
  documents = Array<{key: ''; originalFileName: ''; url: ''}>();
  extractedFields = [];
  totalCommission = 0;
  commissionPaid = 0;
  weeklyCommission = 0;
  weeklyCommissionPaid = false;
  weeklyCommissionDate = '';
  commissionPaymentId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
