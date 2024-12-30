"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callUpload_util_1 = __importDefault(require("./callUpload.util"));
const twilio_1 = __importDefault(require("twilio"));
const dotenv_1 = __importDefault(require("dotenv"));
const call_repomodel_1 = require("../database/repomodels/call.repomodel");
const call_repository_1 = require("../api/repository/call/call.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
dotenv_1.default.config();
class CallUtil {
    constructor() {
        this.callUploadUtil = new callUpload_util_1.default();
        this.callRepository = new call_repository_1.CallRepository();
    }
    async fetchRecording(recordingSid) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
        try {
            const response = await axiosInstanceInterceptor_1.default.get(recordingUrl, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
                },
                responseType: 'arraybuffer', // To get the file as binary data
            });
            //console.log('response', response);
            if (response.status === 200) {
                const buffer = Buffer.from(response.data);
                const fileName = `${recordingSid}`;
                try {
                    console.log('fileName', fileName);
                    await this.callUploadUtil.uploadFile(fileName, buffer);
                }
                catch (uploadError) {
                    console.error('Error uploading file to S3:', uploadError);
                }
                return 'File uploaded to S3';
            }
            else {
                console.error('Failed to fetch recording. Status:', response.status);
                return null;
            }
        }
        catch (error) {
            console.error('Error fetching the Twilio recording:', error);
            return null;
        }
    }
    async createCall(data, userName, callerId) {
        const newCall = new call_repomodel_1.Call();
        const { CaseId, CallSid, AccountSid, To, CallStatus } = data;
        newCall.caseId = CaseId;
        newCall.callSid = CallSid;
        newCall.callerName = userName,
            newCall.accountSid = AccountSid;
        newCall.callTo = To;
        newCall.callFrom = callerId,
            newCall.callStatus = CallStatus;
        return await this.callRepository.create(newCall);
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