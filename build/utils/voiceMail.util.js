"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const call_repository_1 = require("../api/repository/call/call.repository");
const common_util_1 = __importDefault(require("./common.util"));
dotenv_1.default.config();
class VoiceMailUtil {
    constructor() {
        this.callRepository = new call_repository_1.CallRepository();
    }
    async updateVoiceMail(data) {
        const { CallSid, CallStatus, RecordingSid } = data;
        const findCall = await this.callRepository.getOne({
            callSid: CallSid,
        });
        if (!findCall) {
            console.error(`Call not found for CallSid: ${CallSid}`);
            return null;
        }
        const result = await this.callRepository.updateByOne({ callSid: CallSid }, {
            callStatus: CallStatus,
            callRecordingSid: RecordingSid,
            type: 'Voice Mail',
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return result;
    }
    async getVoiceMails(req) {
        const reqTemp = req;
        const identity = reqTemp.twilioNo || process.env.TWILIO_CALLER_ID;
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const voiceMails = await this.callRepository.getAll({ callTo: identity, type: 'Voice Mail', isDeleted: { $ne: true } }, undefined, undefined, { createdAt: -1 }, undefined, true, pageLimit.page, pageLimit.limit);
        const voiceMailCount = await this.callRepository.getCount({
            callTo: identity,
            type: 'Voice Mail',
        });
        return { voiceMails, voiceMailCount };
    }
}
exports.default = new VoiceMailUtil();
//# sourceMappingURL=voiceMail.util.js.map