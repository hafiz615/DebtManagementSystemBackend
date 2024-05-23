import {ITargetCustomFields} from '../../../database/interfaces/customField.interface';
import {TargetCustomFields} from '../../../database/models/targetCF.model';
import {BaseRepository} from '../base.repository';
import {ITargetCFRepository} from './targetCF.repository.interface';

export class TargetCFRepository
  extends BaseRepository<ITargetCustomFields>
  implements ITargetCFRepository
{
  constructor() {
    super(TargetCustomFields);
  }
}
