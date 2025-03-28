import {Request} from 'express';
import callUtil from './call.util';
import dotenv from 'dotenv';
import {Call} from '../database/repomodels/call.repomodel';
import {CallRepository} from '../api/repository/call/call.repository';
import commonUtil from './common.util';
import {ICall} from '../database/interfaces/call.interface';
dotenv.config();

class VoiceMailUtil {
  private callRepository: CallRepository;

  constructor() {
    this.callRepository = new CallRepository();
  }

  async updateVoiceMail(data: any) {
    const {CallSid, CallStatus, RecordingSid} = data;

    const findCall = await this.callRepository.getOne<ICall>({
      callSid: CallSid,
    });
    if (!findCall) {
      console.error(`Call not found for CallSid: ${CallSid}`);
      return null;
    }

    const result = await this.callRepository.updateByOne(
      {callSid: CallSid},
      {
        callStatus: CallStatus,
        callRecordingSid: RecordingSid,
        type: 'Voice Mail',
        updatedAt: commonUtil.getCurrentDate(),
      }
    );

    return result;
  }

  async getVoiceMails(req: Request) {
    const reqTemp: any = req;
    const identity = reqTemp.twilioNo || process.env.TWILIO_CALLER_ID;

    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const voiceMails = await this.callRepository.getAll<ICall>(
      {callTo: identity, type: 'Voice Mail', isDeleted: {$ne: true}},
      undefined,
      undefined,
      {createdAt: -1},
      undefined,
      true,
      pageLimit.page,
      pageLimit.limit
    );
    const voiceMailCount = await this.callRepository.getCount<ICall>({
      callTo: identity,
      type: 'Voice Mail',
    });

    return {voiceMails, voiceMailCount};
  }
}
export default new VoiceMailUtil();
