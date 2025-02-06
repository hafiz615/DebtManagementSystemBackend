import {Request} from 'express';
import {UserRepository} from '../repository/user/user.repository';
import constants from '../../utils/constants.util';
import constantsUtil from '../../utils/constants.util';
import dotenv from 'dotenv';
import {NotificationRepository} from '../repository/notification/notification.repository';
import {INotification} from '../../database/interfaces/notification.interface';
import {NotificationCountRepository} from '../repository/notificationCount/notificationCount.repository';
import {INotificationCount} from '../../database/interfaces/notificationCount.interface';
import {NotificationCount} from '../../database/repomodels/notificationCount.repomodel';
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
    let notifications = await this.notificationRepository.getAll<INotification>(
      {type: req.body.type},
      undefined,
      undefined,
      {createdAt: -1},
      undefined,
      undefined
    );

    if (!notifications.length) {
      return [false, constantsUtil.notFoundMessage('Notification')];
    }

    await this.notificationCountRepository.upsert({}, {$set: {count: 0}});

    return [true, notifications];
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

  async getNotificationCount() {
    const notificationCount: NotificationCount[] =
      await this.notificationCountRepository.getAll({});
    if (!notificationCount) {
      return [false, constants.notFoundMessage('notification')];
    }
    return [true, notificationCount[0].count];
  }
}

export default InboxService;
