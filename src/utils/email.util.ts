import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import {IUser} from '../database/interfaces/user.interface';
import constantsUtil from './constants.util';
import {NotificationConfigurationRepository} from '../api/repository/notificationConfiguration/notificationConfiguration.repository';
import {INotificationConfiguration} from '../database/interfaces/notificationConfiguration.interface';
import {SettingsRepository} from '../api/repository/setting/settings.repository';
import {ISettings} from '../database/interfaces/settings.interface';
import {CaseRepository} from '../api/repository/case/case.repository';
import {ICase} from '../database/interfaces/case.interface';
import {IPayment} from '../database/interfaces/payment.interface';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {IDebtor, IKeyFile} from '../database/interfaces/debtor.interface';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {UserRepository} from '../api/repository/user/user.repository';
import {Request} from 'express';
import {Case} from '../database/repomodels/case.repomodel';
import _ from 'lodash';
import handlebars from 'handlebars';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import twilio, {Twilio} from 'twilio';
import puppeteer from 'puppeteer-core';
import caseUtil from './case.util';
import commonUtil from './common.util';
import UserService from '../api/services/user.service';
import {ClientRequest} from '@sendgrid/client/src/request';
import clientSendgrid from '@sendgrid/client';
import {DataCopier} from './dataCopier.util';
import {IInbox} from '../database/interfaces/inbox.interface';
import {InboxRepository} from '../api/repository/inbox/inbox.repository';
import {Inbox} from '../database/repomodels/inbox.repomodel';
import {NotificationRepository} from '../api/repository/notification/notification.repository';
import {INotification} from '../database/interfaces/notification.interface';
import {Notification} from '../database/repomodels/notification.repomodel';
import asyncLocalStorage from './localStorage.util';
import {NotificationCount} from '../database/repomodels/notificationCount.repomodel';
import {NotificationCountRepository} from '../api/repository/notificationCount/notificationCount.repository';
import {INotificationCount} from '../database/interfaces/notificationCount.interface';
import {v4} from 'uuid';
import UploadUtil from './upload.util';
import mime from 'mime-types';
// import {threadId} from 'worker_threads';

dotenv.config();
class EmailUtil {
  private notificationConfigurationRepository: NotificationConfigurationRepository;
  private settingsRepository: SettingsRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  private userRepository: UserRepository;
  private debtorRepository: DebtorRepository;
  private inboxRepository: InboxRepository;
  private notificationRepository: NotificationRepository;
  private notificationCountRepository: NotificationCountRepository;
  private client: Twilio;
  private uploadUtil: UploadUtil;
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
    this.notificationConfigurationRepository =
      new NotificationConfigurationRepository();
    this.settingsRepository = new SettingsRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
    this.userRepository = new UserRepository();
    this.debtorRepository = new DebtorRepository();
    this.inboxRepository = new InboxRepository();
    this.notificationRepository = new NotificationRepository();
    this.notificationCountRepository = new NotificationCountRepository();
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    clientSendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);
    this.uploadUtil = new UploadUtil();
  }

  async sendInvitationLink(user: IUser, link: string) {
    const msg = {
      to: user.email,
      from: process.env.defaultEmail,
      subject: `${constantsUtil.ACCOUNT_INVITATION_SUBJECT}`,
      text: `Dear ${user.name},

             You've been invited to join our platform! To complete your account setup, please click the link below to set your password:

             ${link}

             If you didn't request this, you can safely ignore this email.

            Thank you,
            First Choice Debt Solutions`,
    };
    try {
      await sgMail.send(msg);
    } catch (error: any) {
      console.log(error.message);
      return error.message;
    }
  }

  async sendLink(user: IUser, text: string, subject: string) {
    const msg = {
      to: user.email,
      from: process.env.defaultEmail,
      subject: subject,
      text: text,
    };
    try {
      await sgMail.send(msg);
    } catch (error: any) {
      console.log(error.message);
      return error.message;
    }
  }

  async sendEmailOrSmsByEvent(
    value: string,
    caseId: string,
    paymentId: string,
    userId: string
  ) {
    const event =
      await this.notificationConfigurationRepository.getOne<INotificationConfiguration>(
        {value}
      );
    const threadId = v4();
    if (event) {
      const userPermissions = event.userPermission;
      let [user, debtor, creditor, caseTemp, payment] =
        await this.initializeValues(caseId, paymentId, userId);
      for (const userPermission of userPermissions) {
        if (userPermission.email_allowed && userPermission.email_template) {
          const template = await this.getTemplate(
            userPermission.email_template
          );
          if (!template) continue;
          const allValues = await this.getValues(template.content);
          let content = template.content;
          if (allValues.length) {
            let replacements = await this.getPopulatedObject(
              event,
              debtor,
              creditor,
              caseTemp,
              user,
              payment,
              allValues
            );
            if (Object.keys(replacements).length) {
              const nestedObject = await this.unflat(replacements);
              const compiledHtml = handlebars.compile(content);
              content = compiledHtml(nestedObject);
            }
          }
          const emails = await this.getEmail(caseTemp, userPermission.role);
          if (emails) {
            const from = template.from
              ? template.from
              : process.env.defaultEmail;
            await this.sendEmail(
              emails,
              from,
              template.subject,
              content,
              null,
              null,
              caseId,
              threadId
            );
            if (caseId) {
              const time = new Date(commonUtil.getCurrentDate());
              await caseUtil.addInHistory(
                {
                  Subject: template.subject,
                  From: from,
                  To: emails,
                  Content: content,
                  Time: time,
                  Action: 'EMAIL',
                  Username: user?.name || '',
                },
                caseId
              );
            }
          }
        }
        if (userPermission.sms_allowed && userPermission.sms_template) {
          const template = await this.getTemplate(userPermission.sms_template);
          if (!template) continue;
          const allValues = await this.getValues(template.content);
          let content = template.content;
          if (allValues.length) {
            let replacements = await this.getPopulatedObject(
              event,
              debtor,
              creditor,
              caseTemp,
              user,
              payment,
              allValues
            );
            if (Object.keys(replacements).length) {
              const nestedObject = await this.unflat(replacements);
              const compiledContent = handlebars.compile(content);
              content = compiledContent(nestedObject);
            }
          }
          let phoneNumbers = await this.getPhone(caseTemp, userPermission.role);
          if (phoneNumbers) {
            const fromNumber = user.twilioNo || process.env.TWILIO_CALLER_ID;
            if (userPermission.role === 'Admin') {
              for (const phone of phoneNumbers) {
                await this.sendSms(content, phone, fromNumber);
              }
            } else {
              await this.sendSms(content, phoneNumbers, fromNumber);
            }
            if (caseId) {
              const time = new Date(commonUtil.getCurrentDate());
              await caseUtil.addInHistory(
                {
                  From: fromNumber,
                  To: phoneNumbers,
                  Content: content,
                  Time: time,
                  Action: 'SMS',
                  Username: user?.name || '',
                },
                caseId
              );
            }
          }
        }
      }
    }
  }

  async sendEmailSmsToDebtorCreditor(
    caseData: any,
    userId: string,
    body: any,
    type: string,
    files: any,
    threadId?: string,
    userName?: string
  ) {
    let {from, sendTo, subject, content, cc, signedUrls} = body;
    if (typeof signedUrls === 'string') {
      signedUrls = JSON.parse(signedUrls);
    }
    let reqThreadId = null;
    if (threadId) {
      reqThreadId = threadId;
    } else {
      threadId = v4();
    }
    const allValues = await this.getValues(content);
    if (allValues.length) {
      let [user, debtor, creditor, caseTemp, payment] =
        await this.initializeValues(caseData?._id, '', userId);
      let replacements = await this.getPopulatedObject(
        null,
        debtor,
        creditor,
        caseTemp,
        user,
        payment,
        allValues
      );
      if (Object.keys(replacements).length) {
        const nestedObject = await this.unflat(replacements);
        const compiledString = handlebars.compile(content);
        content = compiledString(nestedObject);
      }
    }

    const time = new Date(commonUtil.getCurrentDate());
    let attachments = [];
    switch (type) {
      case 'email':
        cc = JSON.parse(cc);
        for (const file of files) {
          attachments.push({
            content: file.buffer.toString('base64'),
            filename: file.originalname,
            type: file.mimetype,
            disposition: 'attachment',
          });
        }
        const data: IKeyFile[] = await this.uploadUtil.awsS3FileUpload(
          files,
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

        signedUrls?.forEach(async (urlObj: IKeyFile) => {
          const byteArray = await this.uploadUtil.getPdfBytesFromS3(urlObj.key);
          const base64Content =
            byteArray.length > 0
              ? Buffer.from(byteArray).toString('base64')
              : '';
          const mimeType = commonUtil.getMimeType(urlObj.key);
          attachments.push({
            content: base64Content,
            filename: urlObj.originalFileName,
            type: mimeType,
            disposition: 'attachment',
          });
        });
        const result = await this.sendEmail(
          sendTo,
          from,
          subject,
          content,
          cc,
          attachments,
          caseData._id,
          threadId,
          userId,
          userName
        );
        const updatedData = [...data, ...signedUrls];
        const uniqueAttachments = _.uniqBy(
          updatedData,
          item => `${item.key}-${item.originalFileName}`
        );
        if (result[0]) {
          await caseUtil.addInHistory(
            {
              Subject: subject,
              From: from,
              To: sendTo,
              CC: cc,
              Content: content,
              Time: time,
              Action: 'EMAIL',
              Attachments: uniqueAttachments,
              Username: userName,
            },
            caseData._id
          );
          const emailData = {
            from,
            to: sendTo,
            subject,
            text: content,
            textAsHtml: content,
            cc: cc,
            attachments: uniqueAttachments,
          };
          if (reqThreadId) {
            this.createInbox(
              caseData,
              'received',
              emailData,
              threadId,
              userId,
              userName,
              'EMAIL',
              true
            );
          } else {
            this.createInbox(
              caseData,
              'sent',
              emailData,
              threadId,
              userId,
              userName,
              'EMAIL'
            );
          }
        }
        return result;
      case 'sms':
        const smsResult = await this.sendSms(content, sendTo, from);
        const smsData = {
          from: from,
          to: sendTo,
          text: content,
          textAsHtml: content,
        };
        this.createNewInbox(
          smsData,
          caseData,
          'sent',
          threadId,
          userId,
          userName,
          null,
          null,
          'SMS'
        );
        if (smsResult[0]) {
          await caseUtil.addInHistory(
            {
              From: from,
              To: sendTo,
              Content: content,
              Time: time,
              Action: 'SMS',
              Username: userName,
            },
            caseData._id
          );
        }
        return smsResult;
      case 'compose':
        cc = JSON.parse(cc);
        for (const file of files) {
          attachments.push({
            content: file.buffer.toString('base64'),
            filename: file.originalname,
            type: file.mimetype,
            disposition: 'attachment',
          });
        }

        const composeData: IKeyFile[] = await this.uploadUtil.awsS3FileUpload(
          files,
          false
        );

        for (const obj of composeData) {
          const mimeType = commonUtil.getMimeType(obj.key);
          obj.url = await this.uploadUtil.getS3FileSignedUrl(
            obj.key,
            mimeType,
            60 * 60 * 24 * 365 * 10,
            process.env.s3BucketName
          );
        }

        const resultCompose = await this.sendEmail(
          sendTo,
          from,
          subject,
          content,
          cc,
          attachments,
          '',
          threadId,
          userId,
          userName
        );

        const composeEmailData = {
          from,
          to: sendTo,
          subject,
          text: content,
          textAsHtml: content,
          cc: cc,
          attachments: composeData,
        };
        if (reqThreadId) {
          const composeEmail = await this.createInbox(
            null,
            'received',
            composeEmailData,
            threadId,
            userId,
            userName,
            'EMAIL'
          );
        } else {
          const composeEmail = await this.createInbox(
            null,
            'sent',
            composeEmailData,
            reqThreadId,
            userId,
            userName,
            'EMAIL'
          );
        }
        return resultCompose;
    }
    return [true, ''];
  }

  async createInbox(
    caseTemp: any,
    type: string,
    emailData: any,
    threadId: any,
    userId?: string,
    userName?: string,
    medium?: string,
    check?: boolean
  ) {
    const newMessage = new Inbox();
    const newNotification = new Notification();
    const newNotificationCount = new NotificationCount();

    if (type == 'received') {
      console.log('ABC');
      const existingInbox =
        await this.inboxRepository.getAllWithoutPagination<IInbox>(
          {
            threadId,
            type,
          },
          undefined,
          undefined,
          {_id: -1}
        );

      console.log('This is existing id', existingInbox[0]);
      if (!existingInbox[0]) {
        const res = await this.createNewInbox(
          emailData,
          caseTemp,
          type,
          threadId,
          userId,
          userName,
          [],
          null,
          medium
        );
        console.log('Create New Inbox response when Received', res);
      } else {
        const existingAttachments = existingInbox[0].attachments || [];
        const mergedAttachments = [
          // ...existingAttachments,
          ...emailData.attachments,
        ];

        const previousMessages = [
          existingInbox[0]._id,
          ...existingInbox[0]?.previousMessages,
        ];

        // Step 3: Filter for uniqueness (by 'key' and 'originalFileName')
        const uniqueAttachments = _.uniqBy(
          mergedAttachments,
          item => `${item.key}-${item.originalFileName}`
        );

        // await this.inboxRepository.updateById<IInbox>(existingInbox._id, {
        //   text: existingInbox.text + emailData.text,
        //   textAsHtml: existingInbox.textAsHtml + emailData.textAsHtml,
        //   attachments: uniqueAttachments,
        // });

        const res = await this.createNewInbox(
          emailData,
          caseTemp,
          type,
          threadId,
          userId,
          userName,
          previousMessages,
          uniqueAttachments,
          medium
        );
        console.log('Create New Inbox response when Response', res);
      }
    } else {
      const res = await this.createNewInbox(
        emailData,
        caseTemp,
        type,
        threadId,
        userId,
        userName,
        [],
        null,
        medium
      );
      console.log('Create New Inbox response when Create', res);
      return res;
    }
    if (caseTemp) {
      newNotification.caseId = caseTemp._id;
      newNotification.text = this.formatText(
        caseTemp.creditor.businessInformation.companyName
      );
    }
    newNotification.type = 'EMAIL';
    newNotification.userId = userId;
    // await this.notificationRepository.create<INotification>(
    //   newNotification as any
    // );
    const currentCount: any = await this.notificationCountRepository.getOne({
      userId: userId,
    });
    if (!check) {
      newNotificationCount.userId = userId;
      newNotificationCount.count = currentCount
        ? (currentCount?.count || 0) + 1
        : 1;

      newNotificationCount.emailCount = currentCount
        ? (currentCount?.emailCount || 0) + 1
        : 1;

      await this.notificationCountRepository.upsert<INotificationCount>(
        {userId},
        newNotificationCount as any
      );
    }
    return newNotification;
  }

  async createNewInbox(
    emailData,
    caseTemp,
    type,
    threadId,
    userId,
    userName,
    previousMessages?,
    uniqueAttachments?,
    medium?
  ) {
    const newMessage = new Inbox();
    const newNotification = new Notification();
    const newNotificationCount = new NotificationCount();

    if (caseTemp) {
      newMessage.caseCode = caseTemp.caseCode;
      newMessage.creditorCompanyName =
        caseTemp.creditor.businessInformation.companyName;
      newMessage.debtorCompanyName =
        caseTemp.debtor.businessInformation.companyName;
      newMessage.negotiatorName = caseTemp.negotiator;
      newNotification.caseId = String(caseTemp._id);
      newMessage.caseId = String(caseTemp._id);
      newNotification.text = this.formatText(caseTemp.caseCode);
      newMessage.debtorId = String(caseTemp.debtor._id);
    }
    newMessage.cc = emailData.cc;
    newMessage.from = emailData.from;
    newMessage.subject = emailData.subject;
    newMessage.text = emailData.text;
    newMessage.textAsHtml = emailData.textAsHtml;
    newMessage.to = emailData.to;
    newMessage.type = type;
    newMessage.medium = medium;
    newMessage.attachments = uniqueAttachments || emailData.attachments;
    newNotification.type = medium;
    newMessage.threadId = threadId;
    newMessage.userId = userId;
    newMessage.userName = userName;
    newMessage.previousMessages = previousMessages;

    return await this.inboxRepository.create<IInbox>(newMessage as any);
  }

  formatText(text: String) {
    return `EMAIL received for ${text}`;
  }

  async sendEmailOrSmsByEventForCommission(value: string, payment: IPayment) {
    const event =
      await this.notificationConfigurationRepository.getOne<INotificationConfiguration>(
        {value}
      );
    if (event) {
      const userPermissions = event.userPermission;
      let debtor = await this.debtorRepository.getById<IDebtor>(
        payment.debtorId
      );
      for (const userPermission of userPermissions) {
        if (userPermission.email_allowed && userPermission.email_template) {
          const template = await this.getTemplate(
            userPermission.email_template
          );
          if (!template) continue;
          const allValues = await this.getValues(template.content);
          let content = template.content;
          if (allValues.length) {
            let replacements = await this.getPopulatedObject(
              event,
              debtor,
              null,
              null,
              null,
              payment,
              allValues
            );
            if (Object.keys(replacements).length) {
              const nestedObject = await this.unflat(replacements);
              const compiledHtml = handlebars.compile(content);
              content = compiledHtml(nestedObject);
            }
          }
          await this.sendEmail(
            process.env.defaultEmail,
            template.from ? template.from : process.env.defaultEmail,
            template.subject,
            content
          );
        }
        if (userPermission.sms_allowed && userPermission.sms_template) {
          // const template = await this.getTemplate(userPermission.sms_template);
          // if (!template) continue;
          // const allValues = await this.getValues(template.content);
          // if (!allValues.length) continue;
          // let replacements = await this.getPopulatedObject(
          //   event,
          //   debtor,
          //   null,
          //   null,
          //   null,
          //   payment,
          //   allValues
          // );
          // if (!Object.keys(replacements).length) continue;
          // const nestedObject = await this.unflat(replacements);
          // const compiledContent = handlebars.compile(template.content);
          // const text = compiledContent(nestedObject);
          // await this.sendSms(text, '');
        }
      }
    }
  }

  async getEmail(caseTemp: any, role: string) {
    switch (role) {
      case 'Admin':
        const users: IUser[] =
          await this.userRepository.getAllWithoutPagination<IUser>({
            role: role,
          });
        const emails = users.map(user => {
          return user.email;
        });
        return emails?.length ? emails : null;
      case 'Debtor':
        return caseTemp?.debtor?.basicInformation?.email
          ? caseTemp.debtor.basicInformation.email
          : null;
      case 'Creditor':
        return caseTemp?.creditor?.basicInformation?.email
          ? caseTemp.creditor.basicInformation.email
          : null;
      case 'Case Manager':
        const manager = await this.userRepository.getById<IUser>(
          caseTemp.managerId
        );
        return manager?.email ? manager.email : null;
      case 'Negotiator':
        const negotiator = await this.userRepository.getById<IUser>(
          caseTemp.negotiatorId
        );
        return negotiator?.email ? negotiator.email : null;
    }
  }

  async getPhone(caseTemp: any, role: string) {
    switch (role) {
      case 'Admin':
        const users: IUser[] =
          await this.userRepository.getAllWithoutPagination<IUser>({
            role: role,
          });
        const phoneNumbers = users.map(user => {
          return user.phone;
        });
        return phoneNumbers?.length ? phoneNumbers : null;
      case 'Debtor':
        return caseTemp?.debtor?.basicInformation?.phone
          ? caseTemp.debtor.basicInformation.phone
          : null;
      case 'Creditor':
        return caseTemp?.creditor?.basicInformation?.phone
          ? caseTemp.creditor.basicInformation.phone
          : null;
      case 'Case Manager':
        const manager = await this.userRepository.getById<IUser>(
          caseTemp.managerId
        );
        return manager?.phone ? manager.phone : null;
      case 'Negotiator':
        const negotiator = await this.userRepository.getById<IUser>(
          caseTemp.negotiatorId
        );
        return negotiator?.phone ? negotiator.phone : null;
      default:
        break;
    }
  }

  async unflat(replacements: {}) {
    const nestedObject = {};
    Object.keys(replacements).forEach(key => {
      _.set(nestedObject, key, replacements[key]);
    });
    return nestedObject;
  }

  private async getTemplate(id: string) {
    const result = await this.settingsRepository.getOne<ISettings>(
      {
        notificationTemplates: {
          $elemMatch: {
            templateId: id,
          },
        },
      },
      undefined,
      'notificationTemplates.$'
    );
    return result?.notificationTemplates?.length
      ? result?.notificationTemplates[0]
      : null;
  }

  async initializeValues(caseId: string, paymentId: string, userId: string) {
    let debtor = null,
      creditor = null,
      user = null,
      payment = null,
      caseTemp = null;
    if (caseId) {
      const result: any = await this.caseRepository.getById<ICase>(
        caseId,
        undefined,
        undefined,
        ['debtor', 'creditor']
      );
      caseTemp = result;
      debtor = result.debtor;
      creditor = result.creditor;
    }
    if (paymentId) {
      const result: any = await this.paymentRepository.getById<IPayment>(
        paymentId,
        undefined,
        undefined,
        {
          path: 'caseId',
          populate: ['debtor', 'creditor'],
        }
      );
      payment = result;
      caseTemp = result.caseId;
      debtor = result.caseId.debtor;
      creditor = result.caseId.creditor;
    }
    if (userId) {
      user = await this.userRepository.getById<IUser>(userId);
    }

    return [user, debtor, creditor, caseTemp, payment];
  }

  async getValues(html: string) {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match = [];

    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  }

  async getPopulatedObject(
    event: INotificationConfiguration,
    debtor: IDebtor,
    creditor: ICreditor,
    caseTemp: ICase,
    user: IUser,
    payment: IPayment,
    keys: Array<string>
  ) {
    // keys = ['debtor.basicInformation.fullName', 'case.totalDebt'];
    const populatedObj = {};
    for (const key of keys) {
      const [beforeDot, ...afterDot] = key.split('.');
      const joinedString = afterDot.join('.');

      switch (beforeDot) {
        case 'case':
          populatedObj[key] = _.get(caseTemp, joinedString) ?? '';
          break;
        case 'debtor':
          populatedObj[key] = _.get(debtor, joinedString) ?? '';
          break;
        case 'creditor':
          populatedObj[key] = _.get(creditor, joinedString) ?? '';
          break;
        case 'payment':
          populatedObj[key] = _.get(payment, joinedString) ?? '';
          break;
        case 'event':
          populatedObj[key] = _.get(event, joinedString) ?? '';
          break;
        case 'user':
          populatedObj[key] = _.get(user, joinedString) ?? '';
          break;
        default:
          populatedObj[key] = '';
          break;
      }
    }
    return populatedObj;
  }

  async sendEmail(
    to: string | string[],
    from: string,
    subject: string,
    content: any,
    cc?: Array<string>,
    attachments?: Array<{
      content: string;
      filename: string;
      type: string;
      disposition: string;
    }>,
    caseId?: string,
    threadId?: string,
    userId?: string,
    userName?: string
  ) {
    let headers = {};

    const bin = await this.getVerifySender(from);
    console.log(bin);
    if (!bin[0]) return [false, bin[1]];
    if (bin === 'debtor' && caseId) {
      const caseTemp: any = await this.caseRepository.getById<ICase>(
        caseId,
        '_id',
        undefined,
        {
          path: 'debtor',
          select: [
            'businessInformation.companyName',
            'businessInformation.EIN',
          ],
        }
      );
      if (caseTemp.debtor?.businessInformation?.companyName)
        subject += ` ${caseTemp.debtor.businessInformation.companyName}`;
      if (caseTemp.debtor?.businessInformation?.EIN)
        subject += ` ${caseTemp.debtor.businessInformation.EIN}`;
      const referenceHeader = `<caseId-${caseId}&userId-${userId}&userName-${userName}&threadId-${threadId}@yourdomain.com>`;
      headers['References'] = referenceHeader;
      // headers['In-Reply-To'] = referenceHeader;
      headers['Message-ID'] = referenceHeader;

      console.log('This is Reference: ', headers['References']);
    }
    if (bin === 'user') {
      const user = await this.userRepository.getOne<IUser>(
        {email: from},
        '_id name',
        undefined
      );
      user
        ? (subject += ` First Choice-DMS ${user.name}`)
        : (subject += ` First Choice-DMS`);
      const referenceHeader = `<caseId-${caseId}&userId-${userId}&userName-${userName}&threadId-${threadId}@yourdomain.com>`;
      headers['References'] = referenceHeader;
      // headers['In-Reply-To'] = referenceHeader;
      headers['Message-ID'] = referenceHeader;
      console.log('This is Reference: ', headers['References']);
    }

    // const thread = `<threadId-${threadId}@yourdomain.com>`;
    const msg = {
      to: to,
      from: from, // Use the email address or domain you verified above
      subject: subject,
      html: content,
    };
    if (Object.keys(headers).length) msg['headers'] = headers;
    if (cc?.length) {
      msg['cc'] = cc;
    }
    if (attachments?.length) {
      msg['attachments'] = attachments;
    }
    try {
      await sgMail.send(msg);
      return [true, `Your email is delivered successfully`];
    } catch (error: any) {
      console.log(error.response.body.errors);
      return [false, 'Could not send email'];
    }
  }

  async sendSms(body: string, phone: string, from: string) {
    try {
      const code = process.env.environment === 'prod' ? '+1' : '+92';
      phone = code + phone;
      const result = await this.client.messages.create({
        body: body,
        from: '+1' + from, //the phone number provided by Twillio
        to: phone, // your own phone number
      });
      if (result.sid) {
        return [true, `Your sms is delivered successfully`];
      }
      return [false, 'Could not send sms'];
    } catch (error: any) {
      console.log(error);
      return [false, error.message];
    }
  }

  async generatePdfFromHtml(htmlString: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(htmlString, {waitUntil: 'networkidle0'});

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  async checkIfConfirmationEmail(subject: string, text: string) {
    const confirmationKeywords = [
      'confirmation',
      'forwarding confirmation',
      'automatically forward',
      'forward mail',
      'confirm request',
      'click the link to confirm',
    ];
    const checkSubject = confirmationKeywords.some(keyword =>
      subject.toLowerCase().includes(keyword)
    );

    const checkText = confirmationKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    );
    if (checkSubject || checkText) return true;
    return false;
  }

  async getConfirmationLinkFromEmailText(text: string): Promise<string | null> {
    const linkRegex = /https:\/\/[^\s]+/g;

    const links = text.match(linkRegex);
    // Return the first match if found
    if (links && links.length > 0) {
      return links[0];
    }
    return null;
  }

  async getVerifySender(data: string) {
    const request: ClientRequest = {
      url: `/v3/verified_senders`,
      method: 'GET',
    };

    const result: any = await clientSendgrid.request(request);

    let email = [];
    if (result[0]?.body?.results?.length) {
      email = result[0].body.results.filter(temp => {
        // console.log('result[0].body.results: ', result[0].body.results);
        return temp.from_email === data;
      });
    }
    console.log('email: ', email);
    if (!email?.length) return [false, 'User is not present on Send Grid'];

    let bin = '';
    if (email[0]?.nickname.includes('debtor') && email[0]?.verified)
      bin = 'debtor';
    if (!email[0]?.nickname.includes('debtor') && email[0]?.verified)
      bin = 'user';
    return bin ? bin : [false, 'User is not verified'];
  }

  async sendEmailIfDebtorGetsAdditionalDebt(
    cases: ICase[],
    debtor: IDebtor,
    creditors: any
  ) {
    const remaining = cases.reduce((sum, item) => sum + item.remaining, 0);
    if (remaining) {
      for (const creditor of creditors) {
        const content = `Dear ${creditor.creditorName},
  
        We hope this message finds you well.
        
        We are writing to inform you that the debtor, ${debtor.basicInformation.fullName}, has currently taken on debt from a total of ${cases.length} creditors. The total outstanding debt across these creditors amounts to ${remaining}.
        
        Please feel free to reach out if you require any further details or have any questions regarding this matter.
        
        Thank you for your attention.
        
        Best regards,
        First Choice Debt Solutions`;
        const to = creditor.creditorEmail;
        const from = process.env.defaultEmail;
        const subject = `Notification Regarding Debtor's Additional Debt`;
        await this.sendEmail(to, from, subject, content);
      }
    }
  }

  async sendEmailIfDebtorPaysDebt(
    caseTemp: ICase,
    debtor: IDebtor,
    creditors: any
  ) {
    for (const creditor of creditors) {
      const content = `Dear ${creditor.creditorName},

      We are pleased to inform you that the debtor, ${debtor.basicInformation.fullName}, has successfully paid their debt. The total amount paid is ${caseTemp.remaining}.

      If you have any questions or require further details, feel free to reach out. We appreciate your continued cooperation.
            
      Thank you for your attention.
      
      Best regards,
      First Choice Debt Solutions`;

      const to = creditor.creditorEmail;
      const from = process.env.defaultEmail;
      const subject = `Notification Regarding Debtor's Paid Debt`;
      await caseUtil.addInHistory(
        {
          Subject: subject,
          From: from,
          To: to,
          Content: content,
          Time: new Date(commonUtil.getCurrentDate()),
          Action: 'EMAIL',
        },
        creditor.caseId
      );
      await this.sendEmail(to, from, subject, content);
    }
  }

  async percentageChangeEmail(
    incDec: string,
    posNeg: string,
    previousMonth: string,
    previousYear: string,
    currentMonth: string,
    currentYear: string,
    creditors: any,
    debtorName: string,
    previousSale: string,
    currentSale: string,
    percentage: number,
    caseId: string
  ) {
    for (const creditor of creditors) {
      const content = `Dear ${creditor.creditorName},

      I hope this email finds you well.
      
      I wanted to provide you with an update on the sales performance of ${debtorName} for ${currentMonth}, ${currentYear}. We have observed a ${posNeg} change in sales compared to the previous month.
      
      Sales for ${currentMonth}, ${currentYear}: $${currentSale}
      Sales for ${previousMonth}, ${previousYear}: $${previousSale}
      Percentage Change: ${incDec} of ${percentage}%
      This growth reflects the recent business activities, and we are closely monitoring performance to ensure that all financial commitments are managed accordingly.
      
      If you have any questions or would like further details, feel free to reach out.
      
      Thank you for your continued partnership.
      
      Best regards,
      First Choice Debt Solutions`;

      const to = creditor.creditorEmail;
      const from = process.env.defaultEmail;
      const subject = `Notice of Sales Performance for ${currentMonth}, ${currentYear}`;
      await caseUtil.addInHistory(
        {
          Subject: subject,
          From: from,
          To: to,
          Content: content,
          Time: new Date(commonUtil.getCurrentDate()),
          Action: 'EMAIL',
        },
        caseId
      );
      await this.sendEmail(to, from, subject, content);
    }
  }

  async sendEmailToDebtorForInitialOverView(debtor: IDebtor, videoLink: any) {
    const content = `\t\t Dear ${debtor.basicInformation.fullName},

      We hope this message finds you well!

      We are excited to share a video that highlights the exclusive benefits tailored just for you. This video provides insights into how you can maximize your experience with us and take full advantage of what we offer.

       \nYou can watch the video here: ${videoLink}.\n\n

      \n If you have any questions or would like to discuss these benefits further, please do not hesitate to reach out. We are here to help! \n

           \nThank you for being a valued member of our community.\n 

      \tBest regards,\n 
      \tFirst Choice Debt Solutions`;

    const to = debtor.basicInformation?.email;
    const from = process.env.defaultEmail;
    const subject = `Discover Your Exclusive Benefits with DMS`;
    await this.sendEmail(to, from, subject, content);
  }
}

export default new EmailUtil();
