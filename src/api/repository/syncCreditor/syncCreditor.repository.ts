import {ISyncCreditor} from '../../../database/interfaces/syncCreditor.interface';
import {SyncCreditor} from '../../../database/models/syncCreditor.model';
import {BaseRepository} from '../base.repository';
import {ISyncCreditorRepository} from './syncCreditor.repository.interface';

export class SyncCreditorRepository
  extends BaseRepository<ISyncCreditor>
  implements ISyncCreditorRepository
{
  constructor() {
    super(SyncCreditor);
  }
}
