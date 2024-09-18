import mongoose, {Schema} from 'mongoose';
import commonUtil from '../../utils/common.util';

export class Debtor {
  basicInformation = {
    fullName: '',
    email: '',
    SSID: '',
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
  commissionPercentage = 20;
  driveUrl = '';
  bulkUpload = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
