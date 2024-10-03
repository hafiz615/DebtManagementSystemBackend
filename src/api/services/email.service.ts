import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import UploadUtil from '../../utils/upload.util';
import emailUtil from '../../utils/email.util';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import {simpleParser} from 'mailparser';
import {DomainVerifyRepository} from '../repository/domainVerify/domainVerify.repository';
import {IDomainVerify} from '../../database/interfaces/domainVerify.interface';
import {DomainVerify} from '../../database/repomodels/domainVerify.repomodel';
import commonUtil from '../../utils/common.util';

class EmailService {
  private caseRepository: CaseRepository;
  private domainVerifyRepository: DomainVerifyRepository;
  constructor() {
    this.caseRepository = new CaseRepository();
    this.domainVerifyRepository = new DomainVerifyRepository();
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
    const from = parseData.from?.value[0].address;
    const checkIfConfirmationEmail = await emailUtil.checkIfConfirmationEmail(
      subject,
      text
    );
    console.log(checkIfConfirmationEmail, 'checkIfConfirmationEmail');
    if (checkIfConfirmationEmail) {
      const link = await emailUtil.getConfirmationLinkFromEmailText(text);
      console.log(link, 'link');
      if (link) {
        const newDomainVerify = new DomainVerify();
        newDomainVerify.link = link;
        newDomainVerify.from = from;
        await this.domainVerifyRepository.create<IDomainVerify>(
          newDomainVerify as any
        );
      }
    }
    // console.log(parseData.textAsHtml, 'textAsHtml');
    // console.log(parseData.html, 'html');
    // console.log(parseData.attachments, 'attachments');
    // console.log(parseData.date, 'date');
    // console.log(parseData.replyTo, 'replyTo');
  }

  async getAllLinks() {
    const links =
      await this.domainVerifyRepository.getAllWithoutPagination<IDomainVerify>({
        isVerified: false,
      });
    return [true, links];
  }

  async linkVerified(req: Request): Promise<[boolean, IDomainVerify | string]> {
    const verified =
      await this.domainVerifyRepository.updateByOne<IDomainVerify>(
        {_id: req.params.id},
        {
          isVerified: true,
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
    if (!verified) {
      return [false, constantsUtil.failureDeleteMessage('link')];
    }
    return [true, ''];
  }
}

export default EmailService;
