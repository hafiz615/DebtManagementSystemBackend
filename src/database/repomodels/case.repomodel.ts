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
  remainingAmountPaid = 0;
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
  contractDetails = null;
  isExempt = '';
  confidence = 0;
  closeDate = '';
  strategyOne_1 = false;
  strategyOne_2 = false;
  strategyOne_3 = false;
  strategyTwo = false;
  strategyThree = false;
  justifications = false;
  lumpSumJustifications = false;
  fullProfitJustifications = false;
  notes = Array<{userId: ''; value: ''; createdAt: ''}>();
  chatId = '';
  settlementRange = false;
  getCaseIdPercentage = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
