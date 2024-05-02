import {
  PutObjectCommand,
  S3Client,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import AWS from 'aws-sdk';
import caseUtil from './case.util';
class UploadUtil {
  private s3Client: S3Client;
  private s3: AWS.S3;

  constructor() {
    this.s3Client = new S3Client({
      region: 'us-east-1',
    });
    this.s3 = new AWS.S3({
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
      s3FileKeys.push({key: key, originalFileName: file.originalname});
    }
    await Promise.all(uploadPromises);
    return s3FileKeys;
  }

  async getS3FileSignedUrl(file: string): Promise<string> {
    let params = {
      Bucket: 'debt-settlement-documents',
      Key: file,
    };
    return await this.s3.getSignedUrlPromise('getObject', params);
  }
}

export default UploadUtil;
