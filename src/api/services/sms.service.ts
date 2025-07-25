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

    console.log(req.body, 'req.body');

    const number = await commonUtil.cleanPhoneNumber(From);
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
      findUser ? String(findUser?._id) : '',
      findUser ? findUser?.name : '',
      null,
      null,
      'SMS',
      name ? name.fullName : ''
    );

    if (caseData) {
      await caseUtil.addInHistory(
        {
          Username: findUser?.name || '',
          From: number,
          To: cleanedTo,
          Content: Body,
          Time: new Date(commonUtil.getCurrentDate()),
          Action: 'SMS',
        },
        String(caseData._id)
      );
    }

    newNotification.caseId = caseData ? String(caseData?._id) : '';

    newNotification.text = this.formatText(name?.companyName || 'Unknown');
    newNotification.type = 'SMS';
    newNotification.inboxId = inbox.id;
    newNotification.userId = findUser ? String(findUser?._id) : '';

    await this.notificationRepository.create<INotification>(
      newNotification as any
    );
    let updatedCount;

    if (findUser) {
      await this.notificationCountRepository.upsert(
        {userId: findUser._id},
        {$inc: {count: 1, smsCount: 1, smsNotificationCount: 1}}
      );

      updatedCount =
        await this.notificationCountRepository.getOne<INotificationCount>({
          userId: findUser._id,
        });
    }

    console.log('new notification', newNotification, updatedCount?.count || 0);
    app.socketInstance.emit('notify', {
      notificationCount: updatedCount?.count || 0,
      type: 'SMS',
      smsNotificationCount: updatedCount?.smsNotificationCount,
      notification: newNotification,
    });

    // const twiml = new MessagingResponse();
    // twiml.message('Message received successfully');

    return [true, null];
  };

  saveCaseDetailNotification = async (req: Request) => {
    const reqTemp: any = req;
    const {caseIds, notificationId, inboxId} = req.body;

    const inboxData: any = await this.inboxRepository.getById<IInbox>(inboxId);
    const notificationData: any =
      await this.notificationRepository.getById<INotification>(notificationId);
    if (!inboxData || !notificationData) {
      return [false, constantsUtil.notFoundMessage('Inbox or Notification')];
    }

    const allCases: any[] =
      await this.caseRepository.getAllWithoutPagination<ICase>(
        {_id: {$in: caseIds}},
        undefined,
        undefined,
        undefined,
        [
          {path: 'debtor', select: ['businessInformation.companyName']},
          {path: 'creditor', select: ['businessInformation.companyName']},
        ]
      );

    if (allCases.length === 0) {
      return [false, constantsUtil.notFoundMessage('Cases')];
    }

    const firstCase = allCases[0];

    await this.inboxRepository.updateById<IInbox>(inboxId, {
      caseCode: firstCase.caseCode,
      caseId: String(firstCase._id),
      debtorCompanyName: firstCase.debtor?.businessInformation?.companyName,
      creditorCompanyName: firstCase.creditor?.businessInformation?.companyName,
      negotiatorName: firstCase.negotiator,
    });

    await this.notificationRepository.updateById<INotification>(
      notificationId,
      {
        text: this.formatText(
          firstCase.debtor?.businessInformation?.companyName
        ),
        ...(notificationData.debtorId && notificationData.debtorId !== ''
          ? {}
          : {debtorId: String(firstCase.debtor?._id)}),
        caseId: allCases.length === 1 ? String(firstCase._id) : '',
        isLinked: true,
      }
    );

    await caseUtil.addInHistory(
      {
        Username: reqTemp.name,
        From: inboxData?.from,
        To: inboxData?.to,
        Content: inboxData?.text,
        Time: new Date(commonUtil.getCurrentDate()),
        Action: 'SMS',
      },
      String(firstCase._id)
    );

    const {_id, ...inboxWithoutId} = inboxData;
    const casesData = [];
    for (const caseTemp of allCases.slice(1)) {
      casesData.push({
        ...inboxWithoutId,
        caseCode: caseTemp.caseCode,
        caseId: String(caseTemp._id),
        debtorCompanyName: caseTemp.creditor?.businessInformation?.companyName,
        creditorCompanyName:
          caseTemp.creditor?.businessInformation?.companyName,
        negotiatorName: caseTemp.negotiator,
      });

      await caseUtil.addInHistory(
        {
          Username: reqTemp.name,
          From: inboxData?.from,
          To: inboxData?.to,
          Content: inboxData?.text,
          Time: new Date(commonUtil.getCurrentDate()),
          Action: 'SMS',
        },
        String(caseTemp._id)
      );
    }
    await this.inboxRepository.createMany(casesData);
    return [true, constantsUtil.successUpdateMessage('Inboxes')];
  };
}

export default SmsService;
