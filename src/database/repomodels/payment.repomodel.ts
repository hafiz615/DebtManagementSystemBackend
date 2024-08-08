import commonUtil from '../../utils/common.util';

export class Payment {
  caseId = '';
  debtorId = '';
  authorized = 'Pending';
  captured = 'Pending';
  status = 'Upcoming';
  debit = 'Pending';
  amount = 0;
  dueDate = '';
  frequency = 0;
  intervalId = '';
  failedReasonAuthorization = '';
  failedReasonCaptured = '';
  rescheduled = '';
  debtorTransId = '';
  retriesAuth = 0;
  retriesCapture = 0;
  timePeriod = '';
  paymentReference = '';
  isDeleted = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
