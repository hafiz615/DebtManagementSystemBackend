import commonUtil from '../../utils/common.util';

export class Case {
  caseOwner = {name: '', id: ''};
  negotiator = {name: '', id: ''};
  manager = {name: '', id: ''};
  caseCode = '';
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
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
