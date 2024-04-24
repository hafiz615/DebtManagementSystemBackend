import {IDebtor} from '../../../database/interfaces/debtor.interface';
import {Debtor} from '../../../database/models/debtor.model';
import {BaseRepository} from '../base.repository';
import {IDebtorRepository} from './debtor.repository.interface';

export class DebtorRepository
  extends BaseRepository<IDebtor>
  implements IDebtorRepository
{
  constructor() {
    super(Debtor);
  }
}
