import CallUploadUtil from './callUpload.util';
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

class CallUtil {
    private callUploadUtil: CallUploadUtil;
    constructor() {
        this.callUploadUtil = new CallUploadUtil();
    }

    async fetchRecording (recordingSid) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
    
      try {
        const response = await fetch(recordingUrl, {
                headers: {
                    Authorization: `Basic ${btoa(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`)}`,
                },
            });
    
            console.log('response',response)
    
            if (response.ok) {
                const fileBlob = await response.blob();
                const arrayBuffer = await fileBlob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const fileName = `${recordingSid}`;
                try {
                  console.log('fileNameasas', fileName)
                    await this.callUploadUtil.uploadFile(fileName, buffer);   
                } catch (uploadError) {
                    console.error('Error uploading file to S3:', uploadError);
                }
    
               return "File uploaded to S3";
            } else {
                console.error("Failed to fetch recording. Status:", response.status);
                return null;
            }
        } catch (error) {
            console.error("Error fetching the Twilio recording:", error);
            return null;
        }
    };

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