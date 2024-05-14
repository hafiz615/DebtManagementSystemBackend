import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import UploadService from '../../services/upload.service';

class UploadController {
  protected uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }
  uploadFiles = async (req: Request | any, res: Response) => {
    try {
      const response = await this.uploadService.uploadFiles(req.files);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.Messages.UPLOAD_FILES_SUCCESS,
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new UploadController();
