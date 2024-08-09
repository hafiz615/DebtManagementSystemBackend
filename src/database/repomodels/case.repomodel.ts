import commonUtil from '../../utils/common.util';

export class Case {
  caseOwner = '';
  caseOwnerId = '';
  negotiator = '';
  negotiatorId = '';
  manager = '';
  managerId = '';
  caseCode = '';
  status = '';
  debtor = '';
  creditor = '';
  totalDebt = 0;
  lastPaymentDate = '';
  feePayment = '';
  paidAmount = 0;
  remaining = 0;
  // documents = Array<{key: ''; originalFileName: ''; url: ''}>();
  intervals = Array<
    | {
        amount: 0;
        startDate: '';
        frequency: 0;
        timePeriod: '';
      }
    | []
  >();
  isDeleted = false;
  contractDetails = {};
  isExempt = '';
  confidence = 0;
  closeDate = '';
  notes = Array<{userId: ''; value: ''; createdAt: ''}>();
  chatId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
