import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import AWS from 'aws-sdk';
import caseUtil from './case.util';
import dotenv from 'dotenv';
dotenv.config();
class UploadUtil {
  private s3Client: S3Client;
  private s3: AWS.S3;

  constructor() {
    this.s3Client = new S3Client({
      credentials: {
        secretAccessKey: process.env.secretAccessKey,
        accessKeyId: process.env.accessKeyId,
      },
      region: 'us-east-1',
    });
    this.s3 = new AWS.S3({
      credentials: {
        secretAccessKey: process.env.secretAccessKey,
        accessKeyId: process.env.accessKeyId,
      },
      region: 'us-east-1',
    });
  }
  async awsS3FileUpload(
    files: any
  ): Promise<{key: string; originalFileName: string}[]> {
    let s3FileKeys = [];
    const uploadPromises = [];
    for (let file of files) {
      const key = await caseUtil.uploadFileFormat(file.originalname);
      let params = {
        Bucket: 'debt-settlement-documents',
        Key: key,
        Body: file.buffer,
      };
      const command = new PutObjectCommand(params);
      uploadPromises.push(this.s3Client.send(command));

      s3FileKeys.push({
        key: key,
        originalFileName: file.originalname,
        url: await this.getS3FileSignedUrl(key),
      });
    }
    await Promise.all(uploadPromises);
    return s3FileKeys;
  }

  async getS3FileSignedUrl(key: string): Promise<string> {
    let params = {
      Bucket: 'debt-settlement-documents',
      Key: key,
    };
    return await this.s3.getSignedUrlPromise('getObject', params);
  }
}

export default UploadUtil;
