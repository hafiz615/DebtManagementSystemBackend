import {Request} from 'express';
import {UserRepository} from '../repository/user/user.repository';
import constants from '../../utils/constants.util';
import constantsUtil from '../../utils/constants.util';
import dotenv from 'dotenv';
import {NotificationRepository} from '../repository/notification/notification.repository';
import {INotification} from '../../database/interfaces/notification.interface';
import {NotificationCountRepository} from '../repository/notificationCount/notificationCount.repository';
import {INotificationCount} from '../../database/interfaces/notificationCount.interface';
// import notificationUtils from '../../utils/notification.utils';
dotenv.config();

class InboxService {
  protected notificationRepository: NotificationRepository;
  protected userRepository: UserRepository;
  protected notificationCountRepository: NotificationCountRepository;
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
    this.notificationCountRepository = new NotificationCountRepository();
  }

  async getAllNotifications(req: Request) {
    // const filters = await notificationUtils.getAllnotificationFilters(req);
    let notifications = await this.notificationRepository.getAll<INotification>(
      undefined,
      undefined,
      undefined,
      {createdAt: -1},
      undefined,
      undefined
      // Number(req.query.page),
      // Number(req.query.limit)
    );
    // const formattedData =  inboxUtils.formatInboxData(inbox)
    // const totalCount = await this.inboxRepository.getCount<IInbox>(filters);

    if (!notifications.length) {
      return [false, constantsUtil.notFoundMessage('Notification')];
    }
    await this.notificationCountRepository.updateMany<INotificationCount>(
      {},
      {count: 0}
    );
    return [true, notifications];
    // return [true, {inbox, totalCount}];
  }

  async markAsRead(id: string): Promise<[boolean, INotification | string]> {
    const notification =
      await this.notificationRepository.getById<INotification>(id);
    if (!notification)
      return [false, constants.notFoundMessage('notification')];
    const tempNotification =
      await this.notificationRepository.updateById<INotification>(id, {
        isRead: true,
      });

    if (!tempNotification) {
      return [false, constants.failureUpdateMessage('notification')];
    }

    return [true, notification];
  }
}

export default InboxService;
