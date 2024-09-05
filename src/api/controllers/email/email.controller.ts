import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import UploadService from '../../services/upload.service';
import EmailService from '../../services/email.service';

class EmailController {
  protected emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }
  sendSmsEmailDebtorCreditor = async (req: Request, res: Response) => {
    try {
      const response = await this.emailService.sendSmsEmailDebtorCreditor(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: response[1],
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new EmailController();
