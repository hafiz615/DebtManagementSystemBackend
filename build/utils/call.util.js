"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upload_util_1 = __importDefault(require("./upload.util"));
const twilio_1 = __importDefault(require("twilio"));
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const call_repomodel_1 = require("../database/repomodels/call.repomodel");
const call_repository_1 = require("../api/repository/call/call.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
dotenv_1.default.config();
class CallUtil {
    constructor() {
        this.uploadUtil = new upload_util_1.default();
        this.callRepository = new call_repository_1.CallRepository();
    }
    async fetchRecording(recordingSid) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
        const response = await axiosInstanceInterceptor_1.default.get(recordingUrl, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            },
            responseType: 'arraybuffer',
        });
        if (response.status === 200) {
            const buffer = Buffer.from(response.data);
            const fileName = `${recordingSid}`;
            await this.uploadUtil.callUploadFile(fileName, buffer);
            return 'File uploaded to S3';
        }
        return null;
    }
    async fetchParentCallSid(callSid) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;
        const response = await axiosInstanceInterceptor_1.default.get(url, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            },
        });
        if (response.status === 200) {
            const call = response.data;
            console.log('Parent CallSid:', call.parent_call_sid);
            return call.parent_call_sid;
        }
        return null;
    }
    async createCall(data, userName, callerId) {
        const newCall = new call_repomodel_1.Call();
        const { CaseId, CallSid, AccountSid, To, CallStatus, Direction } = data;
        newCall.caseId = CaseId;
        newCall.callSid = CallSid;
        newCall.callerName = userName,
            newCall.accountSid = AccountSid;
        newCall.callTo = To;
        newCall.callDirection = Direction,
            newCall.callFrom = callerId,
            newCall.callStatus = CallStatus;
        return await this.callRepository.create(newCall);
    }
    async createIncomingCall(data, userName, callerId) {
        console.log('data', data);
        console.log(callerId);
        console.log('userName', userName);
        const newCall = new call_repomodel_1.Call();
        const { CallSid, AccountSid, CallStatus, From, Direction } = data;
        newCall.callSid = CallSid;
        newCall.callerName = userName,
            newCall.accountSid = AccountSid;
        newCall.callTo = callerId;
        newCall.callDirection = Direction,
            newCall.callFrom = From,
            newCall.callStatus = CallStatus;
        return await this.callRepository.create(newCall);
    }
    async summarizeTranscriptText(text) {
        const openai = new openai_1.default({
            apiKey: process.env.openAiKey
        });
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are an expert summarizer." },
                { role: "user", content: `Please summarize the following transcript:\n${text}` }
            ],
            temperature: 0.5,
            max_tokens: 300,
        });
        return response.choices[0].message.content;
    }
    async createTranscript(recordingSID) {
        const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const transcript = await client.intelligence.v2.transcripts.create({
            channel: { "media_properties": {
                    "source_sid": recordingSID
                } },
            serviceSid: process.env.TWILIO_Service_SID,
        });
        return transcript.links.sentences;
    }
}
exports.default = new CallUtil();
//# sourceMappingURL=call.util.js.map