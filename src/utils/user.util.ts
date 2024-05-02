import {compare} from 'bcryptjs';
import {UserRepository} from '../api/repository/user/user.repository';
import {IUser} from '../database/interfaces/user.interface';
import commonUtil from './common.util';
import constantsUtil from './constants.util';

class UserUtil {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  async checkPassword(password: string) {
    const checkPass = commonUtil.checkPasswordRegex(password);
    if (!checkPass) {
      return false;
    }
    return true;
  }
  async checkUserAndComparePassword(email: string, password: string) {
    const userExist = await this.userRepository.getOne<IUser>(
      {email},
      '+password'
    );
    if (
      !userExist ||
      !userExist.isActive ||
      (userExist && !(await compare(password, userExist.password)))
    ) {
      return false;
    }
    return userExist;
  }

  async getInvitationLink(token: string) {
    const invitationLink = `${constantsUtil.ACCOUNT_INVITATION_BASE_LINK}?token=${token}`;
    return invitationLink;
  }
}
export default new UserUtil();
