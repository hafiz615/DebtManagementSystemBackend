import {ICreditor} from '../../../database/interfaces/creditor.interface';
import {Creditor} from '../../../database/models/creditor.model';
import {BaseRepository} from '../base.repository';
import {ICreditorRepository} from './creditor.repository.interface';

export class CreditorRepository
  extends BaseRepository<ICreditor>
  implements ICreditorRepository
{
  constructor() {
    super(Creditor);
  }
}
