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
    // description: '',
    state: '',
    city: '',
    zipCode: '',
    phone: '',
    address: '',
  };
  accounts = Array<{paymentType: ''; customerVaultId: ''; platform: ''}>();
  // paymentType = '';
  // customerVaultId = '';
  createdBy = '';
  contacts = Array<{
    name: '';
    title: '';
    phone: '';
    email: '';
    // relationWithDebtor: '';
    // state: '';
    // city: '';
    // zipCode: '';
  }>();
  documents = Array<{key: ''; originalFileName: ''; url: ''}>();
  mcaDocuments = Array<{key: ''; originalFileName: ''; url: ''}>();
  bankStatementDocuments = Array<{key: ''; originalFileName: ''; url: ''}>();
  otherDocuments = Array<{key: ''; originalFileName: ''; url: ''}>();
  lawsuitDocuments = Array<{key: ''; originalFileName: ''; url: ''}>();
  extractedFields = [];
  lawsuitFields = null;
  totalCommission = 0;
  commissionPaid = 0;
  // weeklyCommission = 0;
  // weeklyCommissionPaid = false;
  // weeklyCommissionDate = '';
  commissionPercentage = 19;
  bulkUpload = false;
  weeklyBudgetUpdated = false;
  strategy1MaxProfit = 0;
  strategy3MaxProfit = 0;
  strategy1BudgetCustom = 0;
  strategy3BudgetCustom = 0;
  weeklyBudgetKeyStrategy1 = '';
  weeklyBudgetKeyStrategy3 = '';
  weeklyBudgetStrategy1 = 0;
  weeklyBudgetStrategy3 = 0;
  // profitMargin = 0;
  moneyThumbAppId = 0;
  appid = 0;
  totalStatements = 0;
  percentageChange = false;
  percentageChangeDate = '';
  userId = '';
  platform = false;
  trueProfit = 0;
  videoUrl = '';
  intervals = Array<{
    amount: 0;
    startDate: '';
    frequency: 0;
    timePeriod: '';
  }>();
  isExempt = false;
  status = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
