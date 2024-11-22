import {INotificationCount} from '../../../database/interfaces/notificationCount.interface';
import {NotificationCount} from '../../../database/models/notificationCount.model';
import {BaseRepository} from '../base.repository';
import {INotificationCountRepository} from './notificationCount.repository.interface';

export class NotificationCountRepository
  extends BaseRepository<INotificationCount>
  implements INotificationCountRepository
{
  constructor() {
    super(NotificationCount);
  }
}
