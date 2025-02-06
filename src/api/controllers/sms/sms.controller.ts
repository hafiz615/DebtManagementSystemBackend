import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import SmsService from '../../services/sms.service';

class SmsController {
  protected smsService: SmsService;

  constructor() {
    this.smsService = new SmsService();
  }

  receiveMessage = async (req: Request, res: Response) => {
    try {
      const response = await this.smsService.receivedMessage(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      res.type('text/xml');
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  smsFallBack = async (req: Request, res: Response) => {
    try {
      const response = await this.smsService.receivedSmsFallback(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      res.type('text/xml');
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  saveCaseDetailNotification = async (req: Request, res: Response) => {
    try {
      const response = await this.smsService.saveCaseDetailNotification(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: [],
          message: 'Case linked successfully',
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };
}

export default new SmsController();
