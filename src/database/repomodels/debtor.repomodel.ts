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
  transactionTypes = Array<{name: ''; priority: ''}>();
  customerVaultId = '';
  contacts = Array<mongoose.Schema.Types.ObjectId>();
  weeklyBudget = 0;
  totalCommission = 0;
  commissionPaid = 0;
  weeklyCommission = 0;
  weeklyCommissionPaid = false;
  weeklyCommissionDate = '';
  commissionPaymentId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
