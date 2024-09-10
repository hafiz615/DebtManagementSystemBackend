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
      // Access the parsed email data sent by SendGrid
      console.log('req.bodyyyy', req.body);
      const emailData = req.body;

      // Extract email fields
      const to = emailData.to; // Recipient
      const from = emailData.from; // Sender
      const subject = emailData.subject; // Subject
      const text = emailData.text; // Body (plain text)
      const html = emailData.html; // Body (HTML)

      console.log(to, 'to');
      console.log(from, 'from');
      console.log(subject, 'subject');
      console.log(text, 'text');
      console.log(html, 'html');

      // Handle attachments
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
          console.log(`Received file: ${file.originalname}`);
          // file.buffer contains the binary data of the file
        });
      }
      if (req?.file) {
        console.log('File:', req.file?.originalname);
      }
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
