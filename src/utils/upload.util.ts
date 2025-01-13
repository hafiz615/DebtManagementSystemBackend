import {PutObjectCommand, GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import AWS from 'aws-sdk';
import caseUtil from './case.util';
import dotenv from 'dotenv';
import {isEmpty} from 'lodash';
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
    files: any,
    generateKey?: boolean
  ): Promise<{key: string; originalFileName: string}[]> {
    console.log(files, 'filessss');
    let s3FileKeys = [];
    const uploadPromises = [];
    for (let file of files) {
      let key = generateKey
        ? await caseUtil.uploadFileFormat(file.originalname)
        : file.originalname;
      let params = {
        Bucket: process.env.s3BucketName,
        Key: key,
        Body: file.buffer,
      };
      const command = new PutObjectCommand(params);
      uploadPromises.push(this.s3Client.send(command));

      s3FileKeys.push({
        key: key,
        originalFileName: file.originalname,
      });
    }
    await Promise.all(uploadPromises);
    return s3FileKeys;
  }

  getPdfBytesFromS3 = async (key: string) => {
    try {
      const params = {
        Bucket: process.env.s3BucketName,
        Key: key,
      };

      const data = await this.s3Client.send(new GetObjectCommand(params));
      if (data.Body) {
        return await data.Body.transformToByteArray();
      } else {
        return new Uint8Array();
      }
    } catch (error) {
      console.error('Error fetching PDF from S3:', error);
      return error.message;
    }
  };

  async callUploadFile(fileName: string, fileContent: Buffer) {
    console.log('fileName', fileName);
    console.log('fileContent', fileContent);

    const params = {
      Bucket: process.env.callRecordingsBucket,
      Key: fileName,
      Body: fileContent,
    };

    const command = new PutObjectCommand(params);
    const data = await this.s3Client.send(command);
    console.log('File successfully uploaded:', data);
    return data;
  }

  async generateSignedUrl(
    fileName: string,
    type: string,
    expiresIn: number,
    bucket: string,
    download = false
  ) {
    const params = {
      Bucket: bucket,
      Key: fileName,
    };
    if (!download) {
      params['ResponseContentDisposition'] = 'inline';
      params['ResponseContentType'] = type;
    }
    const command = new GetObjectCommand(params);

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn,
    });
    return signedUrl;
  }
  async getS3FileSignedUrl(
    key: string,
    type: string,
    expiresIn: number,
    bucket: string,
    download = false
  ): Promise<string> {
    let params = {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn,
    };
    if (!download) {
      params['ResponseContentDisposition'] = 'inline';
      params['ResponseContentType'] = type;
    }
    return await this.s3.getSignedUrlPromise('getObject', params);
  }

  async sendGridAwsS3FileUpload(
    files: any,
    generateKey?: boolean
  ): Promise<{key: string; originalFileName: string}[]> {
    console.log(files, 'filessss');
    let s3FileKeys = [];
    const uploadPromises = [];
    for (let file of files) {
      let key = generateKey
        ? await caseUtil.uploadFileFormat(file.filename)
        : file.filename;
      let params = {
        Bucket: process.env.s3BucketName,
        Key: key,
        Body: file.content,
      };
      const command = new PutObjectCommand(params);
      uploadPromises.push(this.s3Client.send(command));

      s3FileKeys.push({
        key: key,
        originalFileName: file.filename,
      });
    }
    await Promise.all(uploadPromises);
    return s3FileKeys;
  }
}

export default UploadUtil;
