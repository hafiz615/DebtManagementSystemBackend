"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upload_util_1 = __importDefault(require("./upload.util"));
const twilio_1 = __importDefault(require("twilio"));
const openai_1 = __importDefault(require("openai"));
const twilio_2 = require("twilio");
const common_util_1 = __importDefault(require("./common.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const call_repomodel_1 = require("../database/repomodels/call.repomodel");
const call_repository_1 = require("../api/repository/call/call.repository");
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const case_repository_1 = require("../api/repository/case/case.repository");
const user_repository_1 = require("../api/repository/user/user.repository");
dotenv_1.default.config();
class CallUtil {
    constructor() {
        this.twilioClient = new twilio_2.Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.userRepository = new user_repository_1.UserRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.uploadUtil = new upload_util_1.default();
        this.callRepository = new call_repository_1.CallRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
    }
    async pollRecordingStatus(recordingSid) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.json`;
        for (let i = 0; i < 10; i++) {
            // Max 10 retries
            const response = await axiosInstanceInterceptor_1.default.get(url, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
                },
            });
            const status = response.data.status;
            console.log(`Recording status: ${status}`);
            if (status === 'completed') {
                console.log('Recording is ready to download.');
                return true;
            }
            console.log('Recording still processing, retrying...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // wait 3 sec
        }
        console.log('Recording not ready after retries.');
        return false;
    }
    async fetchRecording(recordingSid) {
        console.log(recordingSid, 'recordingSid');
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
        console.log('recordingUrl', recordingUrl);
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
    async fetchRecordingWithRetry(recordingSid) {
        const isReady = await this.pollRecordingStatus(recordingSid);
        if (!isReady) {
            throw new Error('Recording is still processing after retries.');
        }
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
        const response = await axiosInstanceInterceptor_1.default.get(recordingUrl, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
                responseType: 'arraybuffer',
            },
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
    async createCall(data, user, callerId, debtorId, creditorId) {
        const newCall = new call_repomodel_1.Call();
        const { CaseId, CallSid, AccountSid, To, CallStatus, Direction } = data;
        newCall.caseId = CaseId;
        newCall.debtorId = debtorId;
        newCall.creditorId = creditorId;
        newCall.callSid = CallSid;
        if (user) {
            newCall.callerName = user.name;
            newCall.userId = String(user._id);
        }
        newCall.accountSid = AccountSid;
        if (To)
            newCall.callTo = [To];
        (newCall.callDirection = Direction),
            (newCall.callFrom = callerId),
            (newCall.callStatus = CallStatus);
        return await this.callRepository.create(newCall);
    }
    async createIncomingCall(data, userId) {
        const { CallSid, AccountSid, CallStatus, From, Direction, To } = data;
        console.log('data', data);
        console.log(userId, 'userId');
        const number = await common_util_1.default.extractLastTenDigits(From);
        const name = await this.getDebtorOrCreditorName(number);
        let caseData = null;
        if (name?.creditorId) {
            caseData = await this.caseRepository.getOne({ creditor: name.creditorId, isDeleted: { $ne: true } }, undefined, undefined, [{ path: 'debtor' }, { path: 'creditor' }]);
        }
        if (!caseData && name?.debtorId) {
            const findCases = await this.caseRepository.getAllWithoutPagination({ debtor: name.debtorId, isDeleted: { $ne: true } }, undefined, undefined, undefined, [{ path: 'creditor' }, { path: 'debtor' }]);
            if (findCases.length === 1) {
                caseData = findCases[0];
            }
        }
        let newCall = new call_repomodel_1.Call();
        if (caseData) {
            newCall.debtorId = String(caseData.debtor._id);
            newCall.creditorId = String(caseData.creditor._id);
            newCall.caseId = String(caseData._id);
        }
        newCall.callSid = CallSid;
        newCall.userId = userId;
        newCall.accountSid = AccountSid;
        if (name)
            newCall.callerName = name.fullName;
        newCall.callTo = [To];
        newCall.callDirection = Direction;
        newCall.callFrom = From;
        newCall.callStatus = CallStatus;
        return this.callRepository.create(newCall);
    }
    async getConferenceSidByFriendlyName(friendlyName) {
        const conferences = await this.twilioClient.conferences.list({
            friendlyName,
            status: 'in-progress',
            limit: 1,
        });
        return conferences.length > 0 ? conferences[0].sid : null;
    }
    async addParticipantToConference(toNumber, callerId) {
        const conferenceRoom = `conference_${callerId.replace(/^\+1/, '')}`;
        const conferenceSid = await this.getConferenceSidByFriendlyName(conferenceRoom);
        const participant = await this.twilioClient
            .conferences(conferenceSid)
            .participants.create({
            from: callerId,
            to: toNumber,
            earlyMedia: true,
            beep: 'onEnter',
            label: `customer-${toNumber}-${Date.now()}`,
            record: true,
        });
        await this.callRepository.updateByOne({ callSid: conferenceSid }, {
            $addToSet: { callTo: toNumber },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        console.log(`Participant added. Call SID: ${participant.callSid}`);
    }
    async summarizeTranscriptText(text) {
        const openai = new openai_1.default({
            apiKey: process.env.openAiKey,
        });
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are an expert summarizer.' },
                {
                    role: 'user',
                    content: `Please summarize the following transcript:\n${text}`,
                },
            ],
            temperature: 0.5,
            max_tokens: 300,
        });
        return response.choices[0].message.content;
    }
    async createTranscript(recordingSID) {
        console.log(recordingSID, 'recordingSid');
        const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const transcript = await client.intelligence.v2.transcripts.create({
            channel: {
                media_properties: {
                    source_sid: recordingSID,
                },
            },
            serviceSid: process.env.TWILIO_Service_SID,
        });
        console.log('transcript', transcript);
        return transcript.links.sentences;
    }
    async getDebtorOrCreditorName(number) {
        const getCreditor = await this.creditorRepository.getOne({
            'basicInformation.phone': number,
        });
        if (getCreditor) {
            return {
                creditorId: getCreditor._id,
                fullName: getCreditor.basicInformation.fullName,
                companyName: getCreditor.businessInformation.companyName,
            };
        }
        const getDebtor = await this.debtorRepository.getOne({
            'basicInformation.phone': number,
        });
        if (getDebtor) {
            return {
                debtorId: getDebtor._id,
                fullName: getDebtor.basicInformation.fullName,
                companyName: getDebtor.businessInformation.companyName,
            };
        }
        return null;
    }
    async fetchCallsByStatus(twilioNumber, status) {
        let allCalls = [];
        let pageToken = null;
        let calls = [];
        const findUser = await this.userRepository.getOne({
            twilioNo: twilioNumber,
            isDeleted: false,
        });
        do {
            const response = await this.twilioClient.calls.list({
                to: `client:${twilioNumber}`,
                status,
                pageSize: 100,
                pageToken,
            });
            const callsWithNames = await Promise.all(response.map(async (call) => {
                const number = await common_util_1.default.extractLastTenDigits(call.from);
                const name = await this.getDebtorOrCreditorName(number);
                let caseData = null;
                if (name) {
                    caseData = await this.caseRepository.getOne({
                        $or: [{ debtor: name?.debtorId }, { creditor: name?.creditorId }],
                        isDeleted: { $ne: true },
                    });
                }
                return {
                    from: number,
                    companyName: name ? name.companyName : 'Unknown',
                    status: call.status,
                    time: call.startTime,
                    recepientNumber: await common_util_1.default.cleanPhoneNumber(twilioNumber),
                    recepientName: findUser?.name,
                    caseId: caseData ? caseData._id.toString() : '',
                };
            }));
            calls = [...calls, ...callsWithNames];
            pageToken = response.nextPageUrl ? response.nextPageToken : null;
        } while (pageToken);
        return calls;
    }
    async getMissedCalls(twilioNumber) {
        const noAnswerCalls = await this.fetchCallsByStatus(twilioNumber, 'no-answer');
        const busyCalls = await this.fetchCallsByStatus(twilioNumber, 'busy');
        const allCalls = { noAnswer: noAnswerCalls, busy: busyCalls };
        return allCalls;
    }
}
exports.default = new CallUtil();
//# sourceMappingURL=call.util.js.map