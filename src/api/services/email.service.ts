import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import UploadUtil from '../../utils/upload.util';
import emailUtil from '../../utils/email.util';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import {simpleParser} from 'mailparser';

class EmailService {
  private caseRepository: CaseRepository;
  constructor() {
    this.caseRepository = new CaseRepository();
  }
  async sendSmsEmailDebtorCreditor(req: Request) {
    const reqTemp: any = req;
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    const type = String(req.query.type);
    if (type !== 'email' && type !== 'sms') {
      return [false, 'Type is missing!'];
    }
    return await emailUtil.sendEmailSmsToDebtorCreditor(
      caseTemp._id,
      reqTemp.id,
      req.body,
      type
    );
  }

  async sendGridEmail(req: Request) {
    // String(parsedMail.from?.value[0].address),
    // Array.isArray(parsedMail.to)
    //   ? parsedMail.to[0].text
    //   : parsedMail.to?.text,
    const parseData = await simpleParser(req.body.email);
    // console.log(parseData.to, 'to');
    // console.log(parseData.from, 'from');
    console.log(parseData.subject, 'subject');
    console.log(parseData.text, 'text');
    const subject = parseData.subject;
    const text = parseData.text;
    const checkIfConfirmationEmail = await emailUtil.checkIfConfirmationEmail(
      subject,
      text
    );
    if (checkIfConfirmationEmail) {
      const link = await emailUtil.getConfirmationLinkFromEmailText(text);
      if (link) {
      }
    }
    // console.log(parseData.textAsHtml, 'textAsHtml');
    // console.log(parseData.html, 'html');
    // console.log(parseData.attachments, 'attachments');
    // console.log(parseData.date, 'date');
    // console.log(parseData.replyTo, 'replyTo');
  }
}

export default EmailService;
