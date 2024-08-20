import {INotificationConfiguration} from '../../../database/interfaces/notificationConfiguration.interface';
import {NotificationConfiguration} from '../../../database/models/notificationConfiguration.model';
import {BaseRepository} from '../base.repository';
import {INotificationConfigurationRepository} from './notificationConfiguration.repository.interface';

export class NotificationConfigurationRepository
  extends BaseRepository<INotificationConfiguration>
  implements INotificationConfigurationRepository
{
  constructor() {
    super(NotificationConfiguration);
  }
}
