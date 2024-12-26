import {PutObjectCommand, GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import { getSignedUrl }  from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
dotenv.config();
class CallUploadUtil {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      credentials: {
        secretAccessKey: process.env.callSecretAccessKey,
        accessKeyId: process.env.callAccessKeyId,
      },
      region: 'us-east-1',
    });
  }
  async uploadFile(fileName, fileContent) {
    try {
      console.log('process.env.callSecretAccessKey', process.env.callSecretAccessKey)
      console.log(' process.env.callAccessKeyId,',  process.env.callAccessKeyId);
      console.log("fileName",fileName);
      console.log("fileContent",fileContent);
      
        const params = {
            Bucket: process.env.callRecordingsBucket,
            Key: fileName,
            Body: fileContent,
        };

        const command = new PutObjectCommand(params);
        const data = await this.s3Client.send(command); 
        console.log('File successfully uploaded:', data);
        return data;
    } catch (err) {
        console.error('Error uploading file:', err);
        throw err;
    }
  };

  async generateSignedUrl(fileName) {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.callRecordingsBucket,
            Key: fileName,
        });

        const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return null;
    }
  };
  
}

export default CallUploadUtil;
