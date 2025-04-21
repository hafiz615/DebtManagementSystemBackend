import commonUtil from '../../utils/common.util';

export class Call {
  callSid = '';
  caseId = '';
  userId = '';
  debtorId = '';
  creditorId = '';
  callerName = 'Unknown';
  accountSid = '';
  callTo: string[] = [];
  callFrom = '';
  callStartTime = '';
  callDirection = '';
  callDuration = '';
  callStatus = '';
  callRecordingSid = '';
  isDeleted = false;
  transcriptUrl = '';
  type = 'Call';
  conferenceName = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
