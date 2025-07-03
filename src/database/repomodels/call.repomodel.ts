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
  hangupSource = '';
  recordingUrl = '';
  sipHangupCause = '';
  transcriptionId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
