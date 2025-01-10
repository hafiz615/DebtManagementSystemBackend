import UploadUtil from './upload.util';
import twilio from 'twilio';
import  OpenAI from 'openai';
import dotenv from 'dotenv';
import { DataCopier } from './dataCopier.util';
import { ICall } from '../database/interfaces/call.interface';
import { Call } from '../database/repomodels/call.repomodel';
import { CallRepository } from '../api/repository/call/call.repository';
import axiosInstance from './axiosInstanceInterceptor';
dotenv.config();

class CallUtil {
    private callRepository: CallRepository;
    private uploadUtil: UploadUtil;
    constructor() {
        this.uploadUtil = new UploadUtil();
        this.callRepository = new CallRepository();
    }

    async fetchRecording(recordingSid: string) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
    
      const response = await axiosInstance.get(recordingUrl, {
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

    async fetchParentCallSid(callSid: string) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;

      const response = await axiosInstance.get(url, {
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
    
    async createCall(data: any,userName: string, callerId: string) {
      const newCall= new Call();
      const {CaseId, CallSid, AccountSid, To, CallStatus, Direction} = data;
      newCall.caseId = CaseId;
      newCall.callSid = CallSid;
      newCall.callerName = userName,
      newCall.accountSid = AccountSid;
      newCall.callTo = To;
      newCall.callDirection = Direction,
      newCall.callFrom = callerId,
      newCall.callStatus = CallStatus;
      return await this.callRepository.create<ICall>(newCall as any);
    }

    async createIncomingCall(data: any,userName: string, callerId: string) {
      console.log('userName', userName);
      const newCall= new Call();
      const {CallSid, AccountSid, CallStatus, From, Direction} = data;
      newCall.callSid = CallSid;
      newCall.callerName = userName,
      newCall.accountSid = AccountSid;
      newCall.callTo = callerId;
      newCall.callDirection = Direction,
      newCall.callFrom = From,
      newCall.callStatus = CallStatus;
      return await this.callRepository.create<ICall>(newCall as any);
    }

    async summarizeTranscriptText(text:string){
      const openai = new OpenAI({
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

    async createTranscript(recordingSID: string) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const transcript = await client.intelligence.v2.transcripts.create({
        channel: {"media_properties":{
            "source_sid": recordingSID
          }},
        serviceSid: process.env.TWILIO_Service_SID,
      });
      return transcript.links.sentences;
    }
}
export default new CallUtil();