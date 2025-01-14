"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const case_util_1 = __importDefault(require("./case.util"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class UploadUtil {
    constructor() {
        this.getPdfBytesFromS3 = async (key) => {
            try {
                const params = {
                    Bucket: process.env.s3BucketName,
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
    async awsS3FileUpload(files, generateKey) {
        let s3FileKeys = [];
        const uploadPromises = [];
        for (let file of files) {
            let key = generateKey
                ? await case_util_1.default.uploadFileFormat(file.originalname)
                : file.originalname;
            let params = {
                Bucket: process.env.s3BucketName,
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
    async callUploadFile(fileName, fileContent) {
        const params = {
            Bucket: process.env.callRecordingsBucket,
            Key: fileName,
            Body: fileContent,
        };
        const command = new client_s3_1.PutObjectCommand(params);
        const data = await this.s3Client.send(command);
        return data;
    }
    async generateSignedUrl(fileName, type, expiresIn, bucket, download = false) {
        const params = {
            Bucket: bucket,
            Key: fileName,
        };
        if (!download) {
            params['ResponseContentDisposition'] = 'inline';
            params['ResponseContentType'] = type;
        }
        const command = new client_s3_1.GetObjectCommand(params);
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, {
            expiresIn: expiresIn,
        });
        return signedUrl;
    }
    async getS3FileSignedUrl(key, type, expiresIn, bucket, download = false) {
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
    async sendGridAwsS3FileUpload(files, generateKey) {
        let s3FileKeys = [];
        const uploadPromises = [];
        for (let file of files) {
            let key = generateKey
                ? await case_util_1.default.uploadFileFormat(file.filename)
                : file.filename;
            let params = {
                Bucket: process.env.s3BucketName,
                Key: key,
                Body: file.content,
            };
            const command = new client_s3_1.PutObjectCommand(params);
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
exports.default = UploadUtil;
//# sourceMappingURL=upload.util.js.map