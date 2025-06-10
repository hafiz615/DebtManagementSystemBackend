import {IAccount} from '../../../database/interfaces/account.interface';
import {Account} from '../../../database/models/account.model';
import {BaseRepository} from '../base.repository';
import {IAccountRepository} from './account.repository.interface';
export class AccountRepository
  extends BaseRepository<IAccount>
  implements IAccountRepository
{
  constructor() {
    super(Account);
  }
}
