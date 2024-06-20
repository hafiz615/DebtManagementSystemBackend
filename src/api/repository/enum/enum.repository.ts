import {IEnum} from '../../../database/interfaces/enum.interface';
import {EnumModel} from '../../../database/models/enum.model';
import {BaseRepository} from '../base.repository';
import {IEnumRepository} from './enum.repository.interface';

export class EnumRepository
  extends BaseRepository<IEnum>
  implements IEnumRepository
{
  constructor() {
    super(EnumModel);
  }
}
