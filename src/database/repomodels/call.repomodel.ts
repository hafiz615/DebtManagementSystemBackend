import commonUtil from '../../utils/common.util';

export class Call {
  callSid = '';
  caseId = ''; 
  callerName = ''; 
  accountSid = '';
  callTo = '';
  callFrom = ''; 
  callStartTime = ''; 
  callDuration = ''; 
  callStatus = ''; 
  callRecordingSid = ''; 
  transcriptUrl = ''; 
  createdAt = commonUtil.getCurrentDate(); 
  updatedAt = commonUtil.getCurrentDate(); 
}
