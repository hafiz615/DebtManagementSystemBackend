import commonUtil from '../../utils/common.util';

export class Call {
  callSid = '';
  caseId = '';
  userId = '';
  debtorId = '';
  creditorId = '';
  callerName = 'Unknown';
  accountSid = '';
  callTo = '';
  callFrom = '';
  callStartTime = '';
  callDirection = '';
  callDuration = '';
  callStatus = '';
  callRecordingSid = '';
  isDeleted = false;
  transcriptUrl = '';
  type = 'Call';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
