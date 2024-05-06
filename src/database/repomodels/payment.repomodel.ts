import commonUtil from '../../utils/common.util';

export class Payment {
  caseId = '';
  authorized = '';
  captured = '';
  status = '';
  amount = 0;
  dueDate = '';
  frequency = 0;
  intervalId = '';
  failedReasonAuthorization = '';
  failedReasonCaptured = '';
  rescheduled = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
