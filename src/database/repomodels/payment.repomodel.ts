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
  debtorTransId = '';
  retries = 0;
  commission = 0;
  commissionTransId = '';
  timePeriod = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
