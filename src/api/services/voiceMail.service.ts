import {Request} from 'express';
import UploadUtil from '../../utils/upload.util';
import constantsUtil from '../../utils/constants.util';
import voiceMailUtil from '../../utils/voiceMail.util';

class VoiceMailService {
  private uploadUtil: UploadUtil;

  constructor() {
    this.uploadUtil = new UploadUtil();
  }

  voiceMail = async (req: Request) => {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    if (['no-answer', 'busy', 'failed'].includes(req.body.DialCallStatus)) {
      twiml.say(
        'The person you are trying to reach is unavailable. Please leave a message after the beep.'
      );
      twiml.record({
        maxLength: 60,
        action: `${process.env.webHookURl}/api/v1/voicemail/twilio/voiceMailRecording`,
      });
    } else {
      twiml.say('Thank you for calling. Goodbye!');
    }

    return twiml.toString();
  };

  voiceMailRecording = async (req: Request) => {
    console.log('Voicemail received:', req.body);

    const recordingUrl = req.body.RecordingUrl;
    const createdVoiceMail = await voiceMailUtil.createVoiceMail(req.body);

    console.log(`Voicemail recorded: ${recordingUrl}`);

    if (!createdVoiceMail) {
      return [false, constantsUtil.failureAddMessage('Voice Mail')];
    }
    return [true, constantsUtil.successCreatedMessage('Voice Mail')];
  };

  getVoiceMails = async (req: Request) => {
    const {voiceMails, voiceMailCount} = await voiceMailUtil.getVoiceMails(req);

    if (!voiceMails || voiceMails.length === 0) {
      return [true, []];
    }

    for (const mail of voiceMails) {
      if (mail.callRecordingSid) {
        const getFile = await this.uploadUtil.getS3FileSignedUrl(
          mail.callRecordingSid,
          'audio/mpeg',
          3600,
          process.env.callRecordingsBucket
        );
        if (getFile) {
          mail.callRecordingSid = getFile;
        }
      }
    }

    return [true, {voiceMails, voiceMailCount}];
  };
}

export default VoiceMailService;
