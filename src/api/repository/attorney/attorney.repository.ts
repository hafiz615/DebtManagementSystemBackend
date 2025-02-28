import {IAttorney} from '../../../database/interfaces/attorney.interface';
import {Attorney} from '../../../database/models/attorney.model';
import {BaseRepository} from '../base.repository';
import {IAttorneyRepository} from './attorney.repository.interface';

export class AttorneyRepository
  extends BaseRepository<IAttorney>
  implements IAttorneyRepository
{
  constructor() {
    super(Attorney);
  }
}
