import commonUtil from '../../utils/common.util';

export class PaymentLogging {
  caseId = '';
  debtorId = '';
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
  retriesAuth = 0;
  retriesCapture = 0;
  timePeriod = '';
  paymentReference = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
