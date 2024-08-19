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
import {IDebtor} from '../database/interfaces/debtor.interface';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {UserRepository} from '../api/repository/user/user.repository';
import {Request} from 'express';
import {Case} from '../database/repomodels/case.repomodel';
import _ from 'lodash';
import handlebars from 'handlebars';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
dotenv.config();
class EmailUtil {
  private notificationConfigurationRepository: NotificationConfigurationRepository;
  private settingsRepository: SettingsRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  private userRepository: UserRepository;
  private debtorRepository: DebtorRepository;
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
    this.notificationConfigurationRepository =
      new NotificationConfigurationRepository();
    this.settingsRepository = new SettingsRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
    this.userRepository = new UserRepository();
    this.debtorRepository = new DebtorRepository();
  }

  async sendInvitationLink(user: IUser, link: string) {
    const msg = {
      to: user.email,
      from: 'ralph@firstchoicedebtsolutions.org', // Use the email address or domain you verified above
      subject: `${constantsUtil.ACCOUNT_INVITATION_SUBJECT}`,
      text: `Dear ${user.name},

             You've been invited to join our platform! To complete your account setup, please click the link below to set your password:

             ${link}

             If you didn't request this, you can safely ignore this email.

            Thank you,
            Debt-Settlement Team`,
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
          const allValues = await this.getValuesFromHtml(template.content);
          if (!allValues.length) continue;
          let replacements = await this.getPopulatedObject(
            event,
            debtor,
            creditor,
            caseTemp,
            user,
            payment,
            allValues
          );
          if (!Object.keys(replacements).length) continue;
          const nestedObject = await this.unflat(replacements);
          const compiledHtml = handlebars.compile(template.content);
          const html = compiledHtml(nestedObject);
          const emails = await this.getEmail(caseTemp, userPermission.role);
          await this.sendEmail(
            emails,
            template.from
              ? template.from
              : 'ralph@firstchoicedebtsolutions.org',
            template.subject,
            html
          );
        }
        if (userPermission.sms_allowed && userPermission.sms_template) {
        }
      }
    }
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
          const allValues = await this.getValuesFromHtml(template.content);
          if (!allValues.length) continue;
          let replacements = await this.getPopulatedObject(
            event,
            debtor,
            null,
            null,
            null,
            payment,
            allValues
          );
          if (!Object.keys(replacements).length) continue;
          const nestedObject = await this.unflat(replacements);
          const compiledHtml = handlebars.compile(template.content);
          const html = compiledHtml(nestedObject);
          await this.sendEmail(
            'ralph@firstchoicedebtsolutions.org',
            template.from
              ? template.from
              : 'ralph@firstchoicedebtsolutions.org',
            template.subject,
            html
          );
        }
        if (userPermission.sms_allowed && userPermission.sms_template) {
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
        return emails;
      case 'Debtor':
        return caseTemp.debtor.basicInformation.email;
      case 'Creditor':
        return caseTemp.creditor.basicInformation.email;
      case 'Case Manager':
        const manager = await this.userRepository.getById<IUser>(
          caseTemp.managerId
        );
        return manager.email;
      case 'Negotiator':
        const negotiator = await this.userRepository.getById<IUser>(
          caseTemp.negotiatorId
        );
        return negotiator.email;
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
    console.log(userId, 'userIduserId');
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

  async getValuesFromHtml(html: string) {
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
    html: any
  ) {
    const msg = {
      to: to,
      from: from, // Use the email address or domain you verified above
      subject: subject,
      html: html,
    };
    try {
      await sgMail.send(msg);
    } catch (error: any) {
      console.log(error.response.body);
      return error.message;
    }
  }
}

export default new EmailUtil();
