import {Request} from 'express';
import callUtil from './call.util';
import dotenv from 'dotenv';
import {IVoiceMail} from '../database/interfaces/voiceMail.interface';
import {VoiceMail} from '../database/repomodels/voiceMail.repomodel';
import {VoiceMailRepository} from '../api/repository/voiceMail/voiceMail.repository';
import commonUtil from './common.util';
dotenv.config();

class VoiceMailUtil {
  private voiceMailRepository: VoiceMailRepository;

  constructor() {
    this.voiceMailRepository = new VoiceMailRepository();
  }

  async createVoiceMail(data: any) {
    const newVoiceMail = new VoiceMail();
    const {CallSid, To, From, RecordingSid} = data;

    newVoiceMail.callSid = CallSid;
    newVoiceMail.callTo = To;
    newVoiceMail.callFrom = From;
    newVoiceMail.callRecordingSid = RecordingSid;
    await callUtil.fetchRecording(RecordingSid);
    const transcriptUrl: any = await callUtil.createTranscript(RecordingSid);
    newVoiceMail.transcriptUrl = transcriptUrl;
    return await this.voiceMailRepository.create<IVoiceMail>(
      newVoiceMail as any
    );
  }

  async getVoiceMails(req: Request) {
    const reqTemp: any = req;
    const identity = reqTemp.twilioNo || process.env.TWILIO_CALLER_ID;
    console.log('hello from number', identity);

    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const voiceMails = await this.voiceMailRepository.getAll<IVoiceMail>(
      {callTo: identity},
      undefined,
      undefined,
      {createdAt: -1},
      undefined,
      true,
      pageLimit.page,
      pageLimit.limit
    );
    const voiceMailCount = await this.voiceMailRepository.getCount<IVoiceMail>({
      callTo: identity,
    });

    return {voiceMails, voiceMailCount};
  }
}
export default new VoiceMailUtil();
