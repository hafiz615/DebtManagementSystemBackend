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
      process.env.twilioAccountSid,
      process.env.twilioAuthToken
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
            const fromNumber = process.env.twilioFromNumber;
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
    caseId: string,
    userId: string,
    body: any,
    type: string,
    files: any,
    userName?: string,
  ) {
    let {from, sendTo, subject, content, cc} = body;
    const threadId = v4();
    const allValues = await this.getValues(content);
    if (allValues.length) {
      let [user, debtor, creditor, caseTemp, payment] =
        await this.initializeValues(caseId, '', userId);
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
        const result = await this.sendEmail(
          sendTo,
          from,
          subject,
          content,
          cc,
          attachments,
          caseId,
          threadId,
          userId,
          userName,
        );
        if (result[0]) {
          await caseUtil.addInHistory(
            {
              Subject: subject,
              From: from,
              To: sendTo,
              Content: content,
              Time: time,
              Action: 'EMAIL',
              Attachments: data,
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
            to: sendTo,
            subject,
            text: content,
            textAsHtml: content,
            cc: cc,
            attachments: data,
          };
          this.createInbox(caseData, 'sent', emailData, threadId, userId, userName);
        }
        return result;
      case 'sms':
        const fromNumber = process.env.twilioFromNumber;
        const smsResult = await this.sendSms(content, sendTo, fromNumber);
        if (smsResult[0]) {
          await caseUtil.addInHistory(
            {
              From: fromNumber,
              To: sendTo,
              Content: content,
              Time: time,
              Action: 'SMS',
            },
            caseId
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
        const resultCompose = await this.sendEmail(
          sendTo,
          from,
          subject,
          content,
          cc,
          attachments,
          ''
        );
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
    userName?: string
  ) {
    const newMessage = new Inbox();
    const newNotification = new Notification();
    const newNotificationCount = new NotificationCount();

    if (type == 'received') {
  console.log("ABC"
      )
      const existingInbox = await this.inboxRepository.getOne<IInbox>({
        threadId,
        type,
      });
      if (!existingInbox) {
        const res = await this.createNewInbox(emailData, caseTemp, type, threadId, userId, userName);
        console.log("Create New Inbox response when Received", res)
      } else {
        const existingAttachments = existingInbox.attachments || [];
        const mergedAttachments = [
          ...existingAttachments,
          ...emailData.attachments,
        ];

        // Step 3: Filter for uniqueness (by 'key' and 'originalFileName')
        const uniqueAttachments = _.uniqBy(
          mergedAttachments,
          item => `${item.key}-${item.originalFileName}`
        );
        await this.inboxRepository.updateById<IInbox>(existingInbox._id, {
          text: existingInbox.text + emailData.text,
          textAsHtml: existingInbox.textAsHtml + emailData.textAsHtml,
          attachments: uniqueAttachments,
        });
      }
    } else {
      const res = await this.createNewInbox(emailData, caseTemp, type, threadId, userId, userName);
      console.log("Create New Inbox response when Create", res)
      return res;
    }
    newNotification.caseId = caseTemp._id;
    newNotification.text = this.formatText(
      caseTemp.creditor.businessInformation.companyName
    );
    newNotification.type = 'EMAIL';
    await this.notificationRepository.create<INotification>(
      newNotification as any
    );
    const currentCount: NotificationCount[] =
      await this.notificationCountRepository.getAll(
        {},
        undefined,
        undefined,
        undefined,
        undefined
      );
    if (currentCount.length < 1) {
      newNotificationCount.count = 1;
    } else {
      newNotificationCount.count = currentCount[0].count + 1;
      await this.notificationCountRepository.delete<INotificationCount>({
        count: currentCount[0].count,
      });
    }

    await this.notificationCountRepository.create<INotificationCount>(
      newNotificationCount as any
    );
    return newNotification;
  }

  async createNewInbox(emailData, caseTemp, type, threadId, userId, userName) {
    const newMessage = new Inbox();
    const newNotification = new Notification();
    const newNotificationCount = new NotificationCount();

    newMessage.cc = emailData.cc;
    newMessage.caseCode = caseTemp.caseCode;
    newMessage.creditorCompanyName =
      caseTemp.creditor.businessInformation.companyName;
    newMessage.debtorCompanyName =
      caseTemp.debtor.businessInformation.companyName;
    newMessage.from = emailData.from;
    newMessage.negotiatorName = caseTemp.negotiator;
    newMessage.subject = emailData.subject;
    newMessage.text = emailData.text;
    newMessage.textAsHtml = emailData.textAsHtml;
    newMessage.to = emailData.to;
    newMessage.type = type;
    newMessage.caseId = String(caseTemp._id);
    newMessage.attachments = emailData.attachments;
    newNotification.caseId = String(caseTemp._id);
    newNotification.text = this.formatText(caseTemp.caseCode);
    newNotification.type = 'EMAIL';
    newMessage.threadId = threadId;
    newMessage.userId = userId;
    newMessage.userName = userName;

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
    if (caseId) {
      const bin = await this.getVerifySender(from);
      console.log(bin);
      if (bin === 'debtor') {
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
        headers['References'] = `<caseId-${caseId}&userId-${userId}&userName-${userName}&threadId-${threadId}@yourdomain.com>`;
        console.log("This is Reference: ", headers['References']);
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
        headers['References'] = `<caseId-${caseId}&userId-${userId}&userName-${userName}&threadId-${threadId}@yourdomain.com>`;
        console.log("This is Reference: ", headers['References']);
        
      }
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
    if (attachments.length) {
      msg['attachments'] = attachments;
    }
    try {
      await sgMail.send(msg);
      return [true, `Your email is delivered successfully`];
    } catch (error: any) {
      console.log(error)
      return [false, error.response.errors[0].message];
    }
  }

  async sendSms(body: string, phone: string, from: string) {
    try {
      const result = await this.client.messages.create({
        body: body,
        from: from, //the phone number provided by Twillio
        to: '+1' + phone, // your own phone number
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
        return temp.from_email === data;
      });
    }
    let bin = '';
    if (email[0]?.nickname.includes('debtor')) bin = 'debtor';
    if (!email[0]?.nickname.includes('debtor')) bin = 'user';
    return bin;
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
