import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import UploadService from '../../services/upload.service';
import EmailService from '../../services/email.service';
import {simpleParser} from 'mailparser';

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
          .status(constants.CODE.BAD_REQUEST)
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

  sendGridEmail = async (req: Request, res: Response) => {
    try {
      // String(parsedMail.from?.value[0].address),
      // Array.isArray(parsedMail.to)
      //   ? parsedMail.to[0].text
      //   : parsedMail.to?.text,
      const parseData = await simpleParser(req.body.email);
      // console.log(parseData.to, 'to');
      // console.log(parseData.from, 'from');
      console.log(parseData.subject, 'subject');
      console.log(parseData.text, 'text');
      // console.log(parseData.textAsHtml, 'textAsHtml');
      // console.log(parseData.html, 'html');
      // console.log(parseData.attachments, 'attachments');
      // console.log(parseData.date, 'date');
      // console.log(parseData.replyTo, 'replyTo');
      return res.status(200).send('ok');
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.OK)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new EmailController();
