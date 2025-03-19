"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const call_util_1 = __importDefault(require("./call.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const voiceMail_repomodel_1 = require("../database/repomodels/voiceMail.repomodel");
const voiceMail_repository_1 = require("../api/repository/voiceMail/voiceMail.repository");
const common_util_1 = __importDefault(require("./common.util"));
dotenv_1.default.config();
class VoiceMailUtil {
    constructor() {
        this.voiceMailRepository = new voiceMail_repository_1.VoiceMailRepository();
    }
    async createVoiceMail(data) {
        const newVoiceMail = new voiceMail_repomodel_1.VoiceMail();
        const { CallSid, To, From, RecordingSid } = data;
        newVoiceMail.callSid = CallSid;
        newVoiceMail.callTo = To;
        newVoiceMail.callFrom = From;
        newVoiceMail.callRecordingSid = RecordingSid;
        await call_util_1.default.fetchRecording(RecordingSid);
        const transcriptUrl = await call_util_1.default.createTranscript(RecordingSid);
        newVoiceMail.transcriptUrl = transcriptUrl;
        return await this.voiceMailRepository.create(newVoiceMail);
    }
    async getVoiceMails(req) {
        const reqTemp = req;
        const identity = reqTemp.twilioNo || process.env.TWILIO_CALLER_ID;
        console.log('hello from number', identity);
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const voiceMails = await this.voiceMailRepository.getAll({ callTo: identity }, undefined, undefined, { createdAt: -1 }, undefined, true, pageLimit.page, pageLimit.limit);
        const voiceMailCount = await this.voiceMailRepository.getCount({
            callTo: identity,
        });
        return { voiceMails, voiceMailCount };
    }
}
exports.default = new VoiceMailUtil();
//# sourceMappingURL=voiceMail.util.js.map