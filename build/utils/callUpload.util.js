"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class CallUploadUtil {
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            credentials: {
                secretAccessKey: process.env.callSecretAccessKey,
                accessKeyId: process.env.callAccessKeyId,
            },
            region: 'us-east-1',
        });
    }
    async uploadFile(fileName, fileContent) {
        try {
            console.log('process.env.callSecretAccessKey', process.env.callSecretAccessKey);
            console.log(' process.env.callAccessKeyId,', process.env.callAccessKeyId);
            console.log("fileName", fileName);
            console.log("fileContent", fileContent);
            const params = {
                Bucket: process.env.callRecordingsBucket,
                Key: fileName,
                Body: fileContent,
            };
            const command = new client_s3_1.PutObjectCommand(params);
            const data = await this.s3Client.send(command);
            console.log('File successfully uploaded:', data);
            return data;
        }
        catch (err) {
            console.error('Error uploading file:', err);
            throw err;
        }
    }
    ;
    async generateSignedUrl(fileName) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: process.env.callRecordingsBucket,
                Key: fileName,
            });
            const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: 3600 });
            return signedUrl;
        }
        catch (error) {
            console.error('Error generating signed URL:', error);
            return null;
        }
    }
    ;
}
exports.default = CallUploadUtil;
//# sourceMappingURL=callUpload.util.js.map