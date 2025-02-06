import {Request} from 'express';
import app from '../../app';
import callUtil from '../../utils/call.util';
import emailUtil from '../../utils/email.util';
import {Notification} from '../../database/repomodels/notification.repomodel';
import {NotificationCount} from '../../database/repomodels/notificationCount.repomodel';
import commonUtil from '../../utils/common.util';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import {InboxRepository} from '../repository/inbox/inbox.repository';
import {IInbox} from '../../database/interfaces/inbox.interface';
import {NotificationRepository} from '../repository/notification/notification.repository';
import {INotification} from '../../database/interfaces/notification.interface';
import {UserRepository} from '../repository/user/user.repository';
import {IUser} from '../../database/interfaces/user.interface';
import {v4} from 'uuid';
import caseUtil from '../../utils/case.util';
import {NotificationCountRepository} from '../repository/notificationCount/notificationCount.repository';
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse';
import {INotificationCount} from '../../database/interfaces/notificationCount.interface';
import {constant} from 'lodash';
import constantsUtil from '../../utils/constants.util';

class SmsService {
  private caseRepository: CaseRepository;
  private userRepository: UserRepository;
  private inboxRepository: InboxRepository;
  private notificationRepository: NotificationRepository;
  private notificationCountRepository: NotificationCountRepository;
  constructor() {
    this.caseRepository = new CaseRepository();
    this.userRepository = new UserRepository();
    this.inboxRepository = new InboxRepository();
    this.notificationRepository = new NotificationRepository();
    this.notificationCountRepository = new NotificationCountRepository();
  }
  receivedSmsFallback = async (req: Request) => {
    const twiml = new MessagingResponse();
    twiml.message(
      'We are experiencing issues. Please try again later or contact support.'
    );

    return [true, twiml.toString()];
  };

  formatText(text: String) {
    return `SMS received from ${text}`;
  }

  receivedMessage = async (req: Request) => {
    const {From, Body, SmsStatus, To} = req.body;

    const number = await commonUtil.cleanPhoneNumberConditionally(From);
    const name = await callUtil.getDebtorOrCreditorName(number);

    let caseData: ICase = null;
    const newNotification = new Notification();

    if (name?.creditorId) {
      caseData = await this.caseRepository.getOne<ICase>(
        {creditor: name.creditorId, isDeleted: {$ne: true}},
        undefined,
        undefined,
        [
          {path: 'debtor', select: ['businessInformation.companyName']},
          {path: 'creditor', select: ['businessInformation.companyName']},
        ]
      );
    } else if (name?.debtorId) {
      const findCases =
        await this.caseRepository.getAllWithoutPagination<ICase>(
          {debtor: name.debtorId, isDeleted: {$ne: true}},
          undefined,
          undefined,
          undefined,
          [
            {path: 'creditor', select: ['businessInformation.companyName']},
            {path: 'debtor', select: ['businessInformation.companyName']},
          ]
        );
      newNotification.debtorId = name?.debtorId;
      caseData = findCases.length === 1 ? findCases[0] : null;
    }

    const cleanedTo = await commonUtil.cleanPhoneNumber(To);
    const findUser = await this.userRepository.getOne<IUser>({
      twilioNo: To,
      isDeleted: false,
    });

    const smsData = {
      from: number,
      to: cleanedTo,
      text: Body,
      textAsHtml: Body,
    };

    const inbox = await emailUtil.createNewInbox(
      smsData,
      caseData,
      SmsStatus,
      v4(),
      findUser?._id?.toString() || '',
      findUser?.name || '',
      null,
      null,
      'SMS'
    );

    if (caseData) {
      await caseUtil.addInHistory(
        {
          number,
          To: cleanedTo,
          Content: Body,
          Time: new Date(commonUtil.getCurrentDate()),
          Action: 'SMS',
        },
        caseData._id.toString()
      );
    }
    newNotification.caseId = caseData?._id.toString() || undefined;
    newNotification.text = this.formatText(name?.companyName || 'Unknown');
    newNotification.type = 'SMS';
    newNotification.inboxId = inbox.id;
    // newNotification;

    await this.notificationRepository.create<INotification>(
      newNotification as any
    );

    await this.notificationCountRepository.upsert({}, {$inc: {count: 1}});

    const updatedCount =
      await this.notificationCountRepository.getOne<INotificationCount>({});

    app.socketInstance.emit('notify', {
      notificationCount: updatedCount?.count || 0,
      notification: newNotification,
    });

    const twiml = new MessagingResponse();
    twiml.message('Message received successfully');

    return [true, twiml.toString()];
  };

  saveCaseDetailNotification = async (req: Request) => {
    const reqTemp: any = req;
    let {caseId, notificationId, inboxId} = req.body;

    const caseTemp: any = await this.caseRepository.getById<ICase>(
      caseId,
      undefined,
      undefined,
      [
        {path: 'debtor', select: ['businessInformation.companyName']},
        {path: 'creditor', select: ['businessInformation.companyName']},
      ]
    );

    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }

    console.log(caseTemp.creditor.businessInformation.companyName);
    // return [true, 'successfull'];

    const inboxTemp = await this.inboxRepository.updateById<IInbox>(inboxId, {
      caseCode: caseTemp.caseCode,
      caseId: caseId,
      debtorCompanyName: caseTemp.debtor?.businessInformation?.companyName,
      creditorCompanyName: caseTemp.creditor.businessInformation.companyName,
      negotiatorName: caseTemp.negotiator,
    });

    const notificationTemp =
      await this.notificationRepository.updateById<INotification>(
        notificationId,
        {
          caseId: caseId,
        }
      );

    return [true, 'Successfully save notification'];
  };
}

export default SmsService;
