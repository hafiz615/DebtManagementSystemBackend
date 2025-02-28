import {ILawsuit} from '../../../database/interfaces/lawsuit.interface';
import {Lawsuit} from '../../../database/models/lawsuit.model';
import {BaseRepository} from '../base.repository';
import {ILawsuitRepository} from './lawsuit.repository.interface';

export class LawsuitRepository
  extends BaseRepository<ILawsuit>
  implements ILawsuitRepository
{
  constructor() {
    super(Lawsuit);
  }
}
