"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
class UploadService {
    constructor() {
        this.uploadUtil = new upload_util_1.default();
    }
    async uploadFiles(files) {
        if (!files.length) {
            return [false, constants_util_1.default.Messages.ATTATCH_FILE_ERROR];
        }
        const s3FileKeys = await this.uploadUtil.awsS3FileUpload(files);
        if (!s3FileKeys.length) {
            return [false, constants_util_1.default.Messages.UPLOAD_FILES_FAILURE];
        }
        return [true, s3FileKeys];
    }
}
exports.default = UploadService;
//# sourceMappingURL=upload.service.js.map