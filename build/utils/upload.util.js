"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const case_util_1 = __importDefault(require("./case.util"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class UploadUtil {
    constructor() {
        this.getPdfBytesFromS3 = async (key) => {
            try {
                const params = {
                    Bucket: 'debt-settlement-documents',
                    Key: key,
                };
                const data = await this.s3Client.send(new client_s3_1.GetObjectCommand(params));
                if (data.Body) {
                    return await data.Body.transformToByteArray();
                }
                else {
                    return new Uint8Array();
                }
            }
            catch (error) {
                console.error('Error fetching PDF from S3:', error);
                return error.message;
            }
        };
        this.s3Client = new client_s3_1.S3Client({
            credentials: {
                secretAccessKey: process.env.secretAccessKey,
                accessKeyId: process.env.accessKeyId,
            },
            region: 'us-east-1',
        });
        this.s3 = new aws_sdk_1.default.S3({
            credentials: {
                secretAccessKey: process.env.secretAccessKey,
                accessKeyId: process.env.accessKeyId,
            },
            region: 'us-east-1',
        });
    }
    async awsS3FileUpload(files) {
        console.log(files, 'filessss');
        let s3FileKeys = [];
        const uploadPromises = [];
        for (let file of files) {
            const key = await case_util_1.default.uploadFileFormat(file.originalname);
            let params = {
                Bucket: 'debt-settlement-documents',
                Key: key,
                Body: file.buffer,
            };
            const command = new client_s3_1.PutObjectCommand(params);
            uploadPromises.push(this.s3Client.send(command));
            s3FileKeys.push({
                key: key,
                originalFileName: file.originalname,
            });
        }
        await Promise.all(uploadPromises);
        return s3FileKeys;
    }
    // async getS3FileSignedUrl(key: string, downLoadable=null): Promise<string> {
    //   let params = {
    //     Bucket: 'debt-settlement-documents',
    //     Key: key,
    //     Expires: 86400,
    //     ...(!isEmpty(downLoadable) && {ResponseContentDisposition: 'inline'}),
    //     ...(!isEmpty(downLoadable) && {ResponseContentType: 'application/pdf'}),
    //   };
    //   return await this.s3.getSignedUrlPromise('getObject', params);
    // }
    async getS3FileSignedUrl(key, download = false) {
        let params = {
            Bucket: 'debt-settlement-documents',
            Key: key,
            Expires: 86400,
        };
        if (!download) {
            params['ResponseContentDisposition'] = 'inline';
            params['ResponseContentType'] = 'application/pdf';
        }
        return await this.s3.getSignedUrlPromise('getObject', params);
    }
}
exports.default = UploadUtil;
//# sourceMappingURL=upload.util.js.map