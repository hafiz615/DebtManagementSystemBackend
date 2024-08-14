import {Request, Response} from 'express';
import responseHelper from '../../../utils/responseHelper.util';
import LoggingService from '../../services/logging.service';
import constantsUtil from '../../../utils/constants.util';

class UploadController {
  protected loggingService: LoggingService;

  constructor() {
    this.loggingService = new LoggingService();
  }
  getLogsByTraceId = async (req: Request | any, res: Response) => {
    try {
      const response = await this.loggingService.getLogsByTraceId(req);
      if (!response[0]) {
        return res
          .status(constantsUtil.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constantsUtil.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constantsUtil.CODE.OK,
          data: response[1],
          message: constantsUtil.successFoundMessage('Trace id logs'),
        })
      );
    } catch (error: any) {
      return res
        .status(constantsUtil.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constantsUtil.Messages.EXCEPTION));
    }
  };

  getLogsByTrackingId = async (req: Request | any, res: Response) => {
    try {
      const response = await this.loggingService.getLogsByTrackingId(req);
      if (!response[0]) {
        return res
          .status(constantsUtil.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constantsUtil.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constantsUtil.CODE.OK,
          data: response[1],
          message: constantsUtil.successFoundMessage('Tracking id logs'),
        })
      );
    } catch (error: any) {
      return res
        .status(constantsUtil.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constantsUtil.Messages.EXCEPTION));
    }
  };
}

export default new UploadController();
