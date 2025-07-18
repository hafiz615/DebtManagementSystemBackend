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
import commonUtil from '../../utils/common.util';
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
    const reqTemp: any = req;
    const {type, status} = req.body;
    const userId = reqTemp.id;
    let notifications = null;
    let notificationCount = null;
    if (status) {
      const updateField =
        type === 'EMAIL'
          ? {emailCount: 0}
          : type === 'SMS'
            ? {smsCount: 0}
            : type === 'TASK'
              ? {taskCount: 0}
              : {};
      if (Object.keys(updateField).length) {
        await this.notificationCountRepository.upsert<INotificationCount>(
          {userId},
          {$set: updateField}
        );
        return [true, constants.successFoundMessage('Notification')];
      }
    } else {
      notifications = await this.notificationRepository.getAll<INotification>(
        {type: req.body.type, userId: reqTemp.id},
        undefined,
        undefined,
        {createdAt: -1},
        ['inboxId'],
        undefined
      );

      if (!notifications) {
        return [false, constantsUtil.notFoundMessage('Notification')];
      }

      const getNotificationCount =
        await this.notificationCountRepository.getOne<INotificationCount>({
          userId,
        });

      const updatedNotificationCount = await commonUtil.notificationCount(
        getNotificationCount,
        type
      );

      notificationCount =
        await this.notificationCountRepository.updateByOne<INotificationCount>(
          {userId},
          {...updatedNotificationCount}
        );
    }
    return [true, {notifications, notificationCount}];
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

  async getNotificationCount(req: Request) {
    const reqTemp: any = req;
    const notificationCount =
      await this.notificationCountRepository.getOne<INotificationCount>({
        userId: reqTemp.id,
      });
    if (!notificationCount) {
      return [false, constants.notFoundMessage('notification')];
    }
    return [true, notificationCount];
  }
}

export default InboxService;
