import commonUtil from '../../utils/common.util';

export class Call {
  callSid = '';
  caseId = null;
  userId = null;
  debtorId = null;
  creditorId = null;
  callerName = 'Unknown';
  accountSid = '';
  callTo: string[] = [];
  callFrom = '';
  callStartTime = '';
  callEndTime = '';
  callDirection = '';
  callDuration = 0;
  callStatus = '';
  callRecordingSid = '';
  isDeleted = false;
  transcriptUrl = '';
  type = 'Call';
  conferenceName = '';
  hangup_cause = '';
  hangup_source = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
