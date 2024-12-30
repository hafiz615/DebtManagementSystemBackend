import CallUploadUtil from './callUpload.util';
import twilio from 'twilio';
import dotenv from 'dotenv';
import { DataCopier } from './dataCopier.util';
import { ICall } from '../database/interfaces/call.interface';
import { Call } from '../database/repomodels/call.repomodel';
import { CallRepository } from '../api/repository/call/call.repository';
import axiosInstance from './axiosInstanceInterceptor';
dotenv.config();

class CallUtil {
    private callRepository: CallRepository;
    private callUploadUtil: CallUploadUtil;
    constructor() {
        this.callUploadUtil = new CallUploadUtil();
        this.callRepository = new CallRepository();
    }

    async fetchRecording(recordingSid: string) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
      
        try {
          const response = await axiosInstance.get(recordingUrl, {
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
            } catch (uploadError) {
              console.error('Error uploading file to S3:', uploadError);
            }
      
            return 'File uploaded to S3';
          } else {
            console.error('Failed to fetch recording. Status:', response.status);
            return null;
          }
        } catch (error) {
          console.error('Error fetching the Twilio recording:', error);
          return null;
        }
    }

    async createCall(data,userName: string, callerId: string) {
        const newCall= new Call();
        const {CaseId, CallSid, AccountSid, To, CallStatus} = data;
        newCall.caseId = CaseId;
        newCall.callSid = CallSid;
        newCall.callerName = userName,
        newCall.accountSid = AccountSid;
        newCall.callTo = To;
        newCall.callFrom = callerId,
        newCall.callStatus = CallStatus;
        return await this.callRepository.create<ICall>(newCall as any);
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