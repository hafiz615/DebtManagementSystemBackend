import commonUtil from '../../utils/common.util';

export class Call {
  callSid = null;
  caseId = ''; // Link to the associated case
  callerName = ''; // The name of the person who made the call
  accountSid = null;
  callTo = ''; // Phone number or ID of the person being called
  callFrom = ''; // Phone number or ID of the caller
  callStartTime = ''; // The start date/time of the call
  callDuration = null; // The duration of the call
  callStatus = null; // The status of the call (e.g., completed, missed)
  callRecordingSid = ''; // The identifier for the recording of the call
  transcriptUrl = ''; // The URL to the call transcript (if available)
  createdAt = commonUtil.getCurrentDate(); // Created date
  updatedAt = commonUtil.getCurrentDate(); // Last updated date
}
