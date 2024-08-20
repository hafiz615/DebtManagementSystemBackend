import {IStatus} from '../../../database/interfaces/status.interface';
import {Status} from '../../../database/models/status.model';
import {BaseRepository} from '../base.repository';
import {IStatusRepository} from './status.repository.interface';

export class StatusRepository
  extends BaseRepository<IStatus>
  implements IStatusRepository
{
  constructor() {
    super(Status);
  }
}
