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
  settledAmount = 0;
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
  isExempt = false;
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
  platform = false;
  creditorPaymentsProceed = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
  paymentFrequency = ''; // Payment frequency (text field)
  impliedInterestRate = 0; // Implied interest rate per creditor
  averageInterestRate = 0; // Average interest rate
  lawsuitFile = Array<{key: ''; originalFileName: ''; url: ''}>(); // Array of lawsuit file objects
  hasLawsuits = false; // Do you have lawsuits?
  lawsuitCreditorTags = Array<string>(); // Creditor dropdown tags
  dateServed = ''; // Date served
  serviceFee = 0;
  legalFee = 0;
  affiliateLink = '';
  affiliateEmail = '';
  lawsuitExist = false;
  lawfirmId = null;
  dummyLawsuitExist = false;
  priority = 0;
  paynoteUserId = '';
  paynoteUserFound = false;
  paynoteSourceId = '';
  paynoteSourceVerified = false;
}
