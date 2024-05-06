import commonUtil from '../../utils/common.util';

export class Case {
  debtor = '';
  creditor = '';
  totalDebt = 0;
  lastPaymentDate = '';
  paidAmount = 0;
  remaining = 0;
  documents = Array<{key: ''; originalFileName: ''; url: ''}>();
  paymentPlanStartDate = '';
  intervals = Array<{
    amount: 0;
    startDate: '';
    frequency: 0;
    frequencyProgress: 0;
    timePeriod: '';
    status: '';
  }>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
