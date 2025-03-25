"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const voiceMail_util_1 = __importDefault(require("../../utils/voiceMail.util"));
class VoiceMailService {
    constructor() {
        this.voiceMail = async (req) => {
            const VoiceResponse = require('twilio').twiml.VoiceResponse;
            const twiml = new VoiceResponse();
            if (['no-answer', 'busy', 'failed'].includes(req.body.DialCallStatus)) {
                twiml.say('The person you are trying to reach is unavailable. Please leave a message after the beep.');
                twiml.record({
                    maxLength: 60,
                    action: `${process.env.webHookURl}/api/v1/voicemail/twilio/voiceMailRecording`,
                });
            }
            else {
                twiml.say('Thank you for calling. Goodbye!');
            }
            return twiml.toString();
        };
        this.voiceMailRecording = async (req) => {
            console.log('Voicemail received:', req.body);
            const recordingUrl = req.body.RecordingUrl;
            const createdVoiceMail = await voiceMail_util_1.default.createVoiceMail(req.body);
            console.log(`Voicemail recorded: ${recordingUrl}`);
            if (!createdVoiceMail) {
                return [false, constants_util_1.default.failureAddMessage('Voice Mail')];
            }
            return [true, constants_util_1.default.successCreatedMessage('Voice Mail')];
        };
        this.getVoiceMails = async (req) => {
            const { voiceMails, voiceMailCount } = await voiceMail_util_1.default.getVoiceMails(req);
            if (!voiceMails || voiceMails.length === 0) {
                return [true, []];
            }
            for (const mail of voiceMails) {
                if (mail.callRecordingSid) {
                    const getFile = await this.uploadUtil.getS3FileSignedUrl(mail.callRecordingSid, 'audio/mpeg', 3600, process.env.callRecordingsBucket);
                    if (getFile) {
                        mail.callRecordingSid = getFile;
                    }
                }
            }
            return [true, { voiceMails, voiceMailCount }];
        };
        this.uploadUtil = new upload_util_1.default();
    }
}
exports.default = VoiceMailService;
//# sourceMappingURL=voiceMail.service.js.map