import commonUtil from '../../utils/common.util';

export class Case {
  caseOwner = '';
  caseCode = '';
  createdBy = '';
  status = '';
  debtor = '';
  creditor = '';
  totalDebt = 0;
  lastPaymentDate = '';
  paidAmount = 0;
  remaining = 0;
  documents = Array<{key: ''; originalFileName: ''; url: ''}>();
  intervals = Array<{
    amount: 0;
    startDate: '';
    frequency: 0;
    timePeriod: '';
  }>();
  commissionPaidAlready = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
