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

  async createVoiceMail(data: any) {
    const newVoiceMail = new Call();
    const {CallSid, AccountSid, To, CallStatus, Direction, From, RecordingSid} =
      data;
    newVoiceMail.accountSid = AccountSid;
    newVoiceMail.callSid = CallSid;
    newVoiceMail.callTo = To;
    newVoiceMail.callStatus = CallStatus;
    newVoiceMail.callDirection = Direction;
    newVoiceMail.callFrom = From;
    newVoiceMail.callRecordingSid = RecordingSid;
    newVoiceMail.type = 'Voice Mail';
    await callUtil.fetchRecording(RecordingSid);
    const transcriptUrl: any = await callUtil.createTranscript(RecordingSid);
    newVoiceMail.transcriptUrl = transcriptUrl;
    return await this.callRepository.create<ICall>(newVoiceMail as any);
  }

  async getVoiceMails(req: Request) {
    const reqTemp: any = req;
    const identity = reqTemp.twilioNo || process.env.TWILIO_CALLER_ID;
    console.log('hello from number', identity);

    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const voiceMails = await this.callRepository.getAll<ICall>(
      {callTo: identity, type: 'Voice Mail'},
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
