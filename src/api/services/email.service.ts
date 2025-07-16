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
import {EmailThreadingRepository} from '../repository/emailThreading/emailThreading.repository';
import {IEmailThreading} from '../../database/interfaces/emailThreading.interface';
import inboxUtils from '../../utils/inbox.utils';
import mongoose from 'mongoose';

class EmailService {
  private caseRepository: CaseRepository;
  private domainVerifyRepository: DomainVerifyRepository;
  private inboxRepository: InboxRepository;
  private notificationCountRepository: NotificationCountRepository;
  private uploadUtil: UploadUtil;
  private notificationRepository: NotificationRepository;
  private emailThreadingRepository: EmailThreadingRepository;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.inboxRepository = new InboxRepository();
    this.domainVerifyRepository = new DomainVerifyRepository();
    this.notificationCountRepository = new NotificationCountRepository();
    this.uploadUtil = new UploadUtil();
    this.notificationRepository = new NotificationRepository();
    this.emailThreadingRepository = new EmailThreadingRepository();
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
    const isMongoId = commonUtil.isMongoId(req.params.id);
    if (isMongoId) {
      caseTemp = await this.caseRepository.getById<ICase>(
        req.params.id,
        undefined,
        undefined,
        [
          {path: 'debtor', select: ['businessInformation.companyName']},
          {path: 'creditor', select: ['businessInformation.companyName']},
        ]
      );
    }
    return await emailUtil.sendEmailSmsToDebtorCreditor(
      caseTemp,
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
    // console.log(parseData, 'okoko');
    const subject = parseData.subject;
    const text = parseData.text;
    const from = parseData.from?.value[0].address;
    const fromName = parseData.from?.value[0].name;
    const to = Array.isArray(parseData.to)
      ? parseData.to[0].text
      : parseData.to?.text;
    const cc = Array.isArray(parseData.cc)
      ? parseData.cc[0].text.split(',')
      : parseData.cc?.text.split(',') || [];
    const attachments = parseData.attachments;

    const referencesHeader = parseData.headers.get('references');

    if (from === 'forwarding-noreply@google.com') {
      const link = await emailUtil.getConfirmationLinkFromEmailText(text);
      console.log(link, 'link');
      if (link) {
        const newDomainVerify = new DomainVerify();
        newDomainVerify.link = link;
        newDomainVerify.from = from;
        newDomainVerify.subject = subject;
        // newDomainVerify.text = text;
        await this.domainVerifyRepository.create<IDomainVerify>(
          newDomainVerify as any
        );
      }
      return true;
    }

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
      const userName = this.extractUserName(
        referencesHeader.toString()
      ).replace(/%/g, ' ');
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
      if (caseId && mongoose.Types.ObjectId.isValid(caseId)) {
        console.log('caseId Check in caseID: ', caseId);
        const historyObj = {
          Username: userName,
          Subject: subject,
          From: from,
          To: to,
          Content: extractedHtml,
          Time: new Date(commonUtil.getCurrentDate()),
          Action: 'EMAIL',
          Attachments: data,
        };
        if (cc.length) historyObj['CC'] = cc;
        await caseUtil.addInHistory(historyObj, caseId);
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
        console.log('Email Notification emit');
        app.socketInstance.emit('notify', {
          notificationCount: notificationCount.count,
          type: 'EMAIL',
          emailCount: notificationCount.emailCount,
          notification: notification,
        });
        console.log('Email Notification emit');

        return true;
      }
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

  async emailThreading(req: Request) {
    const userId =
      req.body?.filter?.userId && req.body.filter.userId !== ''
        ? req.body.filter.userId
        : {$ne: null};

    const inboxFilters = await inboxUtils.getAllInboxFilters(req);
    const completed = req.query.completed === 'true' ? false : true;
    const threadFilters = {
      isDeleted: {$ne: true},
      userId: userId,
      isCompleted: {$ne: completed},
    };

    const populateFilter: any = {
      path: 'firstInboxMessage',
    };
    if (Object.keys(inboxFilters).length) {
      populateFilter.match = inboxFilters;
    }
    const allEmailThreading =
      await this.emailThreadingRepository.getAllWithoutPagination<IEmailThreading>(
        threadFilters,
        undefined,
        undefined,
        {_id: -1},
        populateFilter
      );

    const filteredThreads = allEmailThreading.filter(
      (thread: any) => thread.firstInboxMessage
    );

    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const startIndex = (pageLimit.page - 1) * pageLimit.limit;
    const paginatedThreads = filteredThreads.slice(
      startIndex,
      startIndex + pageLimit.limit
    );

    const count = filteredThreads.length;

    return [true, {threads: paginatedThreads, count}];
  }

  async eachThreadingMails(req: Request) {
    const emailThreading =
      await this.emailThreadingRepository.getOne<IEmailThreading>(
        {threadId: req.params.id, isDeleted: {$ne: true}},
        undefined,
        undefined,
        {path: 'previousMessages', populate: ['previousMessages']}
      );

    if (!emailThreading)
      return [false, constantsUtil.notFoundMessage('email.')];

    return [true, emailThreading];
  }

  async emailThreadingByCase(req: Request) {
    const emailThreading =
      await this.emailThreadingRepository.getAllWithoutPagination<IEmailThreading>(
        {caseId: req.params.caseId, isDeleted: {$ne: true}},
        undefined,
        undefined,
        {_id: -1},
        ['firstInboxMessage']
      );

    if (!emailThreading) return [true, []];

    return [true, emailThreading];
  }

  async threadsCompleted(req: Request) {
    const ids = req.body.threadIds;
    const result =
      await this.emailThreadingRepository.updateMany<IEmailThreading>(
        {_id: ids},
        {isCompleted: true}
      );

    if (!result.modifiedCount)
      return [false, constantsUtil.failureUpdateMessage('emails')];

    return [true, []];
  }
}

export default EmailService;
