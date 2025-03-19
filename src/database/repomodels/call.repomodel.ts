import commonUtil from '../../utils/common.util';

export class Call {
  callSid = '';
  caseId = '';
  callerName = '';
  accountSid = '';
  callTo = '';
  callFrom = '';
  callStartTime = '';
  callDirection = '';
  callDuration = '';
  callStatus = '';
  callRecordingSid = '';
  transcriptUrl = '';
  type = 'Call';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
