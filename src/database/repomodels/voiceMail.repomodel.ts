import commonUtil from '../../utils/common.util';

export class VoiceMail {
  callSid = '';
  callTo = '';
  callFrom = '';
  callRecordingSid = '';
  transcriptUrl = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
