import {IUser} from '../../../database/interfaces/user.interface';
import {User} from '../../../database/models/user.model';
import {BaseRepository} from '../base.repository';
import {IUserRepository} from './user.repository.interface';

export class UserRepository
  extends BaseRepository<IUser>
  implements IUserRepository
{
  constructor() {
    super(User);
  }
}
