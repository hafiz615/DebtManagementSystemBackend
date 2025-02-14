import UploadUtil from './upload.util';
import twilio from 'twilio';
import OpenAI from 'openai';
import {Twilio} from 'twilio';
import commonUtil from './common.util';
import dotenv from 'dotenv';
import {DataCopier} from './dataCopier.util';
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
dotenv.config();

class CallUtil {
  private twilioClient: any;
  private callRepository: CallRepository;
  private caseRepository: CaseRepository;
  private debtorRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private userRepository: UserRepository;
  private uploadUtil: UploadUtil;
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
  }

  async fetchRecording(recordingSid: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;

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

  async createCall(data: any, userName: string, callerId: string) {
    const newCall = new Call();
    const {CaseId, CallSid, AccountSid, To, CallStatus, Direction} = data;
    newCall.caseId = CaseId;
    newCall.callSid = CallSid;
    (newCall.callerName = userName), (newCall.accountSid = AccountSid);
    newCall.callTo = To;
    (newCall.callDirection = Direction),
      (newCall.callFrom = callerId),
      (newCall.callStatus = CallStatus);
    return await this.callRepository.create<ICall>(newCall as any);
  }

  async createIncomingCall(data: any, userName: string, callerId: string) {
    const {CallSid, AccountSid, CallStatus, From, Direction} = data;
    console.log('data', data);
    console.log(callerId);
    console.log('userName', userName);
    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
      $or: [
        {'basicInformation.phone': data.from},
        {'businessInformation.phone': data.from},
      ],
    });
    const newCall = new Call();

    newCall.callSid = CallSid;
    (newCall.callerName = userName), (newCall.accountSid = AccountSid);
    newCall.callTo = callerId;
    (newCall.callDirection = Direction),
      (newCall.callFrom = From),
      (newCall.callStatus = CallStatus);
    return await this.callRepository.create<ICall>(newCall as any);
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
    return transcript.links.sentences;
  }

  async getDebtorOrCreditorName(number: string) {
    const getCreditor = await this.creditorRepository.getOne<ICreditor>({
      'basicInformation.phone': number,
    });

    if (getCreditor) {
      return {
        creditorId: getCreditor._id,
        creditorName: getCreditor.basicInformation.fullName,
        companyName: getCreditor.businessInformation.companyName,
      };
    }

    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
      'basicInformation.phone': number,
    });

    if (getDebtor) {
      return {
        debtorId: getDebtor._id,
        debtorName: getDebtor.basicInformation.fullName,
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
          const number = await commonUtil.cleanPhoneNumberConditionally(
            call.from
          );
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
}
export default new CallUtil();
