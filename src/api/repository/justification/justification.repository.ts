import {IJustification} from '../../../database/interfaces/justification.interface';
import {Justification} from '../../../database/models/justification.model';
import {BaseRepository} from '../base.repository';
import {IJustificationRepository} from './justification.repository.interface';

export class JustificationRepository
  extends BaseRepository<IJustification>
  implements IJustificationRepository
{
  constructor() {
    super(Justification);
  }
}
