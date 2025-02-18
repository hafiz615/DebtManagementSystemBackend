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
import {IKeyFile} from '../../database/interfaces/debtor.interface';
import {NotificationRepository} from '../repository/notification/notification.repository';
import {INotification} from '../../database/interfaces/notification.interface';

class EmailService {
  private caseRepository: CaseRepository;
  private domainVerifyRepository: DomainVerifyRepository;
  private inboxRepository: InboxRepository;
  private notificationCountRepository: NotificationCountRepository;
  private uploadUtil: UploadUtil;
  private notificationRepository: NotificationRepository;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.inboxRepository = new InboxRepository();
    this.domainVerifyRepository = new DomainVerifyRepository();
    this.notificationCountRepository = new NotificationCountRepository();
    this.uploadUtil = new UploadUtil();
    this.notificationRepository = new NotificationRepository();
  }
  async sendSmsEmailDebtorCreditor(req: Request) {
    const reqTemp: any = req;
    const threadId = reqTemp.query.threadId;
    // const reqTemp: any = req;
    const type = String(req.query.type);
    if (type !== 'email' && type !== 'sms' && type !== 'compose') {
      return [false, 'Type is missing!'];
    }
    let caseTemp = null;
    if (type !== 'compose') {
      caseTemp = await this.caseRepository.getById<ICase>(
        req.params.id,
        undefined,
        undefined,
        [
          {path: 'debtor', select: ['businessInformation.companyName']},
          {path: 'creditor', select: ['businessInformation.companyName']},
        ]
      );
      if (!caseTemp) {
        return [false, constantsUtil.notFoundMessage('case')];
      }
    }
    return await emailUtil.sendEmailSmsToDebtorCreditor(
      caseTemp ? caseTemp : null,
      reqTemp.id,
      req.body,
      type,
      reqTemp?.files?.files || [],
      threadId,
      reqTemp.name
    );
  }

  async sendGridEmail(req: Request) {
    const reqTemp: any = req;
    const parseData = await simpleParser(req.body.email);
    console.log(parseData, 'okoko');
    const subject = parseData.subject;
    const text = parseData.text;
    const from = parseData.from?.value[0].address;
    const fromName = parseData.from?.value[0].name;
    const to = Array.isArray(parseData.to)
      ? parseData.to[0].text
      : parseData.to?.text;
    const cc = Array.isArray(parseData.cc)
      ? parseData.cc[0].text.split(',')
      : parseData.cc?.text.split(',');
    const attachments = parseData.attachments;
    const referencesHeader = parseData.headers.get('references');
    console.log('referencesHeader: ', referencesHeader);
    if (referencesHeader) {
      const data: IKeyFile[] = await this.uploadUtil.sendGridAwsS3FileUpload(
        attachments,
        false
      );
      for (const obj of data) {
        const mimeType = commonUtil.getMimeType(obj.key);
        obj.url = await this.uploadUtil.getS3FileSignedUrl(
          obj.key,
          mimeType,
          60 * 60 * 24 * 365 * 10,
          process.env.s3BucketName
        );
      }
      const caseId = this.extractCaseId(referencesHeader.toString());
      console.log('caseId: ', caseId);
      const userId = this.extractUserId(referencesHeader.toString());
      console.log('userId: ', userId);
      const userName = this.extractUserName(referencesHeader.toString());
      console.log('userName: ', userName);
      const threadId = this.extractThreadId(referencesHeader.toString());
      console.log('threadId: ', threadId);

      // Split the text at "wrote:"
      const testParts = text.split('wrote:');
      const extractedText = testParts[0]?.trim() + ' wrote:';
      console.log('Extracted Text:', extractedText);

      const htmlText = parseData.textAsHtml;
      const splitParts = htmlText.split(/(wrote:<\/p>)/);
      const extractedHtml = splitParts[0] + (splitParts[1] || '');
      console.log('extractedHtml: ', extractedHtml);

      let caseData = null;
      if (caseId) {
        console.log('caseId Check in caseID: ', caseId);

        await caseUtil.addInHistory(
          {
            Subject: subject,
            From: from,
            To: to,
            CC: cc,
            Content: extractedHtml,
            Time: new Date(commonUtil.getCurrentDate()),
            Action: 'EMAIL',
            Attachments: data,
            Username: userName,
          },
          caseId
        );
        caseData = await this.caseRepository.getById<ICase>(
          caseId,
          undefined,
          undefined,
          [
            {path: 'debtor', select: ['businessInformation.companyName']},
            {path: 'creditor', select: ['businessInformation.companyName']},
          ]
        );
      }
      const emailData = {
        from,
        to,
        subject,
        extractedText,
        textAsHtml: extractedHtml,
        cc: cc,
        attachments: data,
      };
      if (threadId) {
        console.log('threadId: ', threadId);
        console.log('threadId: inside the thread ID ', threadId);

        const notification = await emailUtil.createInbox(
          caseData,
          'received',
          emailData,
          threadId,
          userId,
          userName,
          'EMAIL'
        );
        if (!caseData) {
          notification.text = emailUtil.formatText(userName);
        }
        await this.notificationRepository.create<INotification>(
          notification as any
        );
        const notificationCount: any =
          await this.notificationCountRepository.getOne(
            {userId: userId},
            undefined,
            undefined,
            undefined,
            undefined
          );
        app.socketInstance.emit('notify', {
          notificationCount: notificationCount.count,
          type: 'EMAIL',
          emailCount: notificationCount.emailCount,
          notification: notification,
        });

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

  extractThreadId = (header: string) => {
    const match = header && header.match(/threadId-([^&@>]+)/);
    return match ? match[1] : null;
  };

  extractCaseId = (header: string) => {
    const match = header && header.match(/caseId-([^&@>]+)/);
    return match ? match[1] : null;
  };

  extractUserId = (header: string) => {
    const match = header && header.match(/userId-([^&@>]+)/);
    return match ? match[1] : null;
  };

  extractUserName = (header: string) => {
    const match = header && header.match(/userName-([^&@>]+)/);
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
