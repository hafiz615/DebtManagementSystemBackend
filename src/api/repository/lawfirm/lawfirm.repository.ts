import {ILawfirm} from '../../../database/interfaces/lawfirm.interface';
import {Lawfirm} from '../../../database/models/lawfirm.model';
import {BaseRepository} from '../base.repository';
import {ILawfirmRepository} from './lawfirm.repository.interface';

export class LawfirmRepository
  extends BaseRepository<ILawfirm>
  implements ILawfirmRepository
{
  constructor() {
    super(Lawfirm);
  }
}
