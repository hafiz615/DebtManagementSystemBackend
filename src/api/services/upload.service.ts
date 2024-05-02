import constantsUtil from '../../utils/constants.util';
import UploadUtil from '../../utils/upload.util';

class UploadService {
  private uploadUtil: UploadUtil;
  constructor() {
    this.uploadUtil = new UploadUtil();
  }
  async uploadFiles(files: any): Promise<[boolean, Object[] | string]> {
    if (!files.length) {
      return [false, constantsUtil.Messages.ATTATCH_FILE_ERROR];
    }
    const s3FileKeys = await this.uploadUtil.awsS3FileUpload(files);

    if (!s3FileKeys.length) {
      return [false, constantsUtil.Messages.UPLOAD_FILES_FAILURE];
    }
    return [true, s3FileKeys];
  }
}

export default UploadService;
