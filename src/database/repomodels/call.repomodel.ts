import commonUtil from '../../utils/common.util';

export class Call {
  callSid = '';
  callLegId = '';
  callSessionId = '';
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
  isRead = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
