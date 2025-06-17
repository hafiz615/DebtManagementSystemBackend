import UploadUtil from './upload.util';
import twilio from 'twilio';
import OpenAI from 'openai';
import {Twilio} from 'twilio';
import commonUtil from './common.util';
import dotenv from 'dotenv';
import {ICall} from '../database/interfaces/call.interface';
import {Call} from '../database/repomodels/call.repomodel';
import {CallRepository} from '../api/repository/call/call.repository';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import axiosInstance from './axiosInstanceInterceptor';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {CaseRepository} from '../api/repository/case/case.repository';
import {ICase} from '../database/interfaces/case.interface';
import {UserRepository} from '../api/repository/user/user.repository';
import {IUser} from '../database/interfaces/user.interface';
import axios from 'axios';
import {DataCopier} from './dataCopier.util';
dotenv.config();

class CallUtil {
  private twilioClient: any;
  private callRepository: CallRepository;
  private caseRepository: CaseRepository;
  private debtorRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private userRepository: UserRepository;
  private uploadUtil: UploadUtil;
  private telnyxLink: string;
  constructor() {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.userRepository = new UserRepository();
    this.caseRepository = new CaseRepository();
    this.uploadUtil = new UploadUtil();
    this.callRepository = new CallRepository();
    this.debtorRepository = new DebtorRepository();
    this.creditorRepository = new CreditorRepository();
    this.telnyxLink = 'https://api.telnyx.com/v2';
  }

  async pollRecordingStatus(recordingSid: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.json`;

    for (let i = 0; i < 10; i++) {
      // Max 10 retries
      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${accountSid}:${authToken}`
          ).toString('base64')}`,
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

  async fetchRecording(recordingSid: string) {
    console.log(recordingSid, 'recordingSid');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
    console.log('recordingUrl', recordingUrl);

    const response = await axiosInstance.get(recordingUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`,
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
  async fetchRecordingWithRetry(recordingSid: string) {
    const isReady = await this.pollRecordingStatus(recordingSid);
    if (!isReady) {
      throw new Error('Recording is still processing after retries.');
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;

    const response = await axiosInstance.get(recordingUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`,
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

  async fetchParentCallSid(callSid: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;

    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`,
      },
    });

    if (response.status === 200) {
      const call = response.data;
      console.log('Parent CallSid:', call.parent_call_sid);
      return call.parent_call_sid;
    }
    return null;
  }

  async createCall(
    data: any,
    user: any,
    callerId: string,
    debtorId: any,
    creditorId: any
  ) {
    const newCall = new Call();
    const {CaseId, CallSid, AccountSid, CallStatus, Direction, ConferenceName} =
      data;
    newCall.caseId = CaseId;
    newCall.debtorId = debtorId;
    newCall.creditorId = creditorId;
    newCall.callSid = CallSid;
    if (user) {
      newCall.callerName = user.name;
      newCall.userId = user?._id;
    }
    newCall.accountSid = AccountSid;
    newCall.conferenceName = ConferenceName;
    newCall.callDirection = Direction;
    newCall.callFrom = callerId;
    newCall.callStatus = CallStatus; // hangup_cause
    newCall.callDuration = data.callDuration;
    newCall.hangup_source = data.hangup_source;
    newCall.callStartTime = data.callStartTime;
    newCall.callStartTime = data.callEndTime;
    newCall.callTo = data.callTo;

    const validatedCall = DataCopier.copy(newCall, data as ICall);
    return await this.callRepository.create<ICall>(validatedCall);
  }

  async createIncomingCall(data: any, userId: string) {
    const {CallSid, AccountSid, CallStatus, From, Direction, To} = data;
    console.log('data', data);
    console.log(userId, 'userId');

    const number = await commonUtil.extractLastTenDigits(From);
    const name = await this.getDebtorOrCreditorName(number);
    let caseData: any = null;

    if (name?.creditorId) {
      caseData = await this.caseRepository.getOne<ICase>(
        {creditor: name.creditorId, isDeleted: {$ne: true}},
        undefined,
        undefined,
        [{path: 'debtor'}, {path: 'creditor'}]
      );
    }

    if (!caseData && name?.debtorId) {
      const findCases =
        await this.caseRepository.getAllWithoutPagination<ICase>(
          {debtor: name.debtorId, isDeleted: {$ne: true}},
          undefined,
          undefined,
          undefined,
          [{path: 'creditor'}, {path: 'debtor'}]
        );

      if (findCases.length === 1) {
        caseData = findCases[0];
      }
    }

    let newCall = new Call();
    if (caseData) {
      newCall.debtorId = String(caseData.debtor._id);
      newCall.creditorId = String(caseData.creditor._id);
      newCall.caseId = String(caseData._id);
    }
    newCall.callSid = CallSid;
    newCall.userId = userId;
    newCall.accountSid = AccountSid;
    if (name) newCall.callerName = name.fullName;
    newCall.callTo = [To];
    newCall.callDirection = Direction;
    newCall.callFrom = From;
    newCall.callStatus = CallStatus;
    return this.callRepository.create<ICall>(newCall as any);
  }

  async addParticipantToConference(
    toNumber: string,
    callerId: string,
    conferenceSid: string
  ) {
    const participant = await this.twilioClient
      .conferences(conferenceSid)
      .participants.create({
        from: callerId,
        to: toNumber,
        earlyMedia: true,
        beep: 'onEnter',
        label: `customer-${toNumber}-${Date.now()}`,
        startConferenceOnEnter: false, // 👈 this should usually be false for others
        endConferenceOnExit: false,
        record: true,
      });

    await this.callRepository.updateByOne(
      {callSid: conferenceSid},
      {
        $addToSet: {callTo: toNumber},
        updatedAt: commonUtil.getCurrentDate(),
      }
    );

    console.log(`Participant added. Call SID: ${participant.callSid}`);
  }

  async summarizeTranscriptText(text: string) {
    const openai = new OpenAI({
      apiKey: process.env.openAiKey,
    });
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {role: 'system', content: 'You are an expert summarizer.'},
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

  async createTranscript(recordingSID: string) {
    console.log(recordingSID, 'recordingSid');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
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

  async getDebtorOrCreditorName(number: string) {
    const getCreditor = await this.creditorRepository.getOne<ICreditor>({
      'basicInformation.phone': number,
    });

    if (getCreditor) {
      return {
        creditorId: getCreditor._id,
        fullName: getCreditor.basicInformation.fullName,
        companyName: getCreditor.businessInformation.companyName,
      };
    }

    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
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

  async fetchCallsByStatus(twilioNumber: string, status: string) {
    let allCalls = [];
    let pageToken = null;
    let calls = [];
    const findUser = await this.userRepository.getOne<IUser>({
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

      const callsWithNames = await Promise.all(
        response.map(async (call: any) => {
          const number = await commonUtil.extractLastTenDigits(call.from);
          const name = await this.getDebtorOrCreditorName(number);
          let caseData = null;

          if (name) {
            caseData = await this.caseRepository.getOne<ICase>({
              $or: [{debtor: name?.debtorId}, {creditor: name?.creditorId}],
              isDeleted: {$ne: true},
            });
          }

          return {
            from: number,
            companyName: name ? name.companyName : 'Unknown',
            status: call.status,
            time: call.startTime,
            recepientNumber: await commonUtil.cleanPhoneNumber(twilioNumber),
            recepientName: findUser?.name,
            caseId: caseData ? caseData._id.toString() : '',
          };
        })
      );

      calls = [...calls, ...callsWithNames];
      pageToken = response.nextPageUrl ? response.nextPageToken : null;
    } while (pageToken);

    return calls;
  }

  async getMissedCalls(twilioNumber: string) {
    const noAnswerCalls = await this.fetchCallsByStatus(
      twilioNumber,
      'no-answer'
    );
    const busyCalls = await this.fetchCallsByStatus(twilioNumber, 'busy');

    const allCalls = {noAnswer: noAnswerCalls, busy: busyCalls};

    return allCalls;
  }

  // Telnyx

  async telnyxPostRequest(url: string, data: any) {
    const response = await axios.post(`${this.telnyxLink}${url}`, data, {
      headers: {
        Authorization: `Bearer ${process.env.telnyxApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  }
}
export default new CallUtil();
