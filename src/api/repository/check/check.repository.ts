import {ICheck} from '../../../database/interfaces/check.interface';
import {Check} from '../../../database/models/check.model';
import {BaseRepository} from '../base.repository';
import {ICheckRepository} from './check.repository.interface';
export class CheckRepository
  extends BaseRepository<ICheck>
  implements ICheckRepository
{
  constructor() {
    super(Check);
  }
}
