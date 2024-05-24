import {ISettings} from '../../../database/interfaces/settings.interface';
import {Settings} from '../../../database/models/settings.model';
import {BaseRepository} from '../base.repository';
import {ISettingsRepository} from './settings.repository.interface';

export class SettingsRepository
  extends BaseRepository<ISettings>
  implements ISettingsRepository
{
  constructor() {
    super(Settings);
  }
}
