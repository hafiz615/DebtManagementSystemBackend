import {INotification} from '../../../database/interfaces/notification.interface';
import {Notification} from '../../../database/models/notification.model';
import {BaseRepository} from '../base.repository';
import {INotificationRepository} from './notification.repository.interface';

export class NotificationRepository
  extends BaseRepository<INotification>
  implements INotificationRepository
{
  constructor() {
    super(Notification);
  }
}
