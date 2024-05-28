import commonUtil from '../../utils/common.util';

export class Payment {
  caseId = '';
  authorized = 'Pending';
  captured = 'Pending';
  status = 'Upcoming';
  amount = 0;
  dueDate = '';
  frequency = 0;
  intervalId = '';
  failedReasonAuthorization = '';
  failedReasonCaptured = '';
  rescheduled = '';
  transactionId: '';
  retries = 0;
  commission = 0;
  creditorAmount = 0;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
