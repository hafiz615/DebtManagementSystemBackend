"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const call_util_1 = __importDefault(require("./call.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const call_repository_1 = require("../api/repository/call/call.repository");
const common_util_1 = __importDefault(require("./common.util"));
dotenv_1.default.config();
class VoiceMailUtil {
    constructor() {
        this.callRepository = new call_repository_1.CallRepository();
    }
    async updateVoiceMail(data) {
        const { CallSid, To, CallStatus, From, RecordingSid } = data;
        const findCall = await this.callRepository.getOne({
            callSid: CallSid,
        });
        if (!findCall) {
            console.error(`Call not found for CallSid: ${CallSid}`);
            return null;
        }
        console.log('Voice mail call found:', findCall);
        const number = await common_util_1.default.extractLastTenDigits(From);
        const name = await call_util_1.default.getDebtorOrCreditorName(number);
        const updatedData = {
            callTo: To,
            callStatus: CallStatus,
            callFrom: From,
            callRecordingSid: RecordingSid,
            type: 'Voice Mail',
            updatedAt: common_util_1.default.getCurrentDate(),
        };
        if (name) {
            updatedData.callerName = name.fullName;
        }
        const result = await this.callRepository.updateByOne({ callSid: CallSid }, updatedData);
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