import {IUser} from '../../../database/interfaces/user.interface';
import {User} from '../../../database/models/user.model';
import GlobalVariables from '../../../global';
import {BaseRepository} from '../base.repository';
import {IUserRepository} from './user.repository.interface';

export class UserRepository
  extends BaseRepository<IUser>
  implements IUserRepository
{
  constructor() {
    super(User);
  }

  async updateUserByIdOrEmail(email: string, user: IUser) {
    return await User.findOneAndUpdate(
      {
        $or: [{_id: GlobalVariables.userId}, {email: email}],
      },
      user,
      {new: true}
    );
  }
}
