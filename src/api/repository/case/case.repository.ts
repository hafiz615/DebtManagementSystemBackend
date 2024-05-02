import {ICase} from '../../../database/interfaces/case.interface';
import {Case} from '../../../database/models/case.model';
import {BaseRepository} from '../base.repository';
import {ICaseRepository} from './case.repository.interface';
export class CaseRepository
  extends BaseRepository<ICase>
  implements ICaseRepository
{
  constructor() {
    super(Case);
  }
}
