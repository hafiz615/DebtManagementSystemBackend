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
import caseUtil from '../../utils/case.util';
import {Case} from '../../database/models/case.model';
import {Inbox} from '../../database/repomodels/inbox.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';
import {InboxRepository} from '../repository/inbox/inbox.repository';
import {IInbox} from '../../database/interfaces/inbox.interface';
import app from '../../app';
import asyncLocalStorage from '../../utils/localStorage.util';
import {NotificationCountRepository} from '../repository/notificationCount/notificationCount.repository';
import {NotificationCount} from '../../database/repomodels/notificationCount.repomodel';

class EmailService {
  private caseRepository: CaseRepository;
  private domainVerifyRepository: DomainVerifyRepository;
  private inboxRepository: InboxRepository;
  private notificationCountRepository: NotificationCountRepository;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.inboxRepository = new InboxRepository();
    this.domainVerifyRepository = new DomainVerifyRepository();
    this.notificationCountRepository = new NotificationCountRepository();
  }
  async sendSmsEmailDebtorCreditor(req: Request) {
    const reqTemp: any = req;
    const type = String(req.query.type);
    if (type !== 'email' && type !== 'sms' && type !== 'compose') {
      return [false, 'Type is missing!'];
    }
    let caseTemp = null;
    if (type !== 'compose') {
      caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
      if (!caseTemp) {
        return [false, constantsUtil.notFoundMessage('case')];
      }
    }
    return await emailUtil.sendEmailSmsToDebtorCreditor(
      caseTemp ? String(caseTemp._id) : null,
      reqTemp.id,
      req.body,
      type
    );
  }

  async sendGridEmail(req: Request) {
    const parseData = await simpleParser(req.body.email);
    const subject = parseData.subject;
    const text = parseData.text;
    const from = parseData.from?.value[0].address;
    const to = Array.isArray(parseData.to)
      ? parseData.to[0].text
      : parseData.to?.text;
    const referencesHeader = parseData.headers.get('references');
    if (referencesHeader) {
      const caseId = this.extractCaseId(referencesHeader.toString());
      const threadId = this.extractThreadId(subject);
      if (caseId) {
        await caseUtil.addInHistory(
          {
            Subject: subject,
            From: from,
            To: to,
            Content: parseData.textAsHtml,
            Time: new Date(commonUtil.getCurrentDate()),
            Action: 'EMAIL',
          },
          caseId
        );
        const caseData = await this.caseRepository.getById<ICase>(
          caseId,
          undefined,
          undefined,
          [
            {path: 'debtor', select: ['businessInformation.companyName']},
            {path: 'creditor', select: ['businessInformation.companyName']},
          ]
        );
        const emailData = {
          from,
          to,
          subject,
          text,
          textAsHtml: parseData.textAsHtml,
          cc: parseData.cc,
        };
        if (threadId) {
          const notification = await emailUtil.createInbox(
            caseData,
            'received',
            emailData,
            threadId
          );
          const notificationCount: NotificationCount[] =
            await this.notificationCountRepository.getAll(
              undefined,
              undefined,
              undefined,
              undefined,
              undefined
            );
          app.socketInstance.emit('notify', {
            notificationCount: notificationCount[0].count,
            notification: notification,
          });
        }
        return true;
      }
    }

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
        newDomainVerify.subject = subject;
        newDomainVerify.text = text;
        await this.domainVerifyRepository.create<IDomainVerify>(
          newDomainVerify as any
        );
      }
      return true;
    }
    return true;
  }

  extractCaseId = (header: string) => {
    const match = header && header.match(/caseId-([^@>]+)/);
    return match ? match[1] : null;
  };

  extractThreadId = (header: string) => {
    const match = header && header.match(/threadId-([^@>]+)/);
    return match ? match[1] : null;
  };

  async getAllLinks() {
    const links =
      await this.domainVerifyRepository.getAllWithoutPagination<IDomainVerify>(
        {
          isVerified: false,
        },
        undefined,
        undefined,
        {_id: -1}
      );
    if (!links.length) {
      return [false, constantsUtil.notFoundMessage('links')];
    }
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
