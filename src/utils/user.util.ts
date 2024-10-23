import {compare} from 'bcryptjs';
import {UserRepository} from '../api/repository/user/user.repository';
import {IUser} from '../database/interfaces/user.interface';
import commonUtil from './common.util';
import constantsUtil from './constants.util';
import {Request} from 'express';
import {EnvSetup} from '../database/repomodels/setEnv';

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
      {email: email, isDeleted: false},
      '+password'
    );
    if (!userExist) return false;
    if (
      !userExist.isActive ||
      (userExist && !(await compare(password, userExist.password)))
    ) {
      return false;
    }
    return userExist;
  }

  async getInvitationLink(token: string, type: string) {
    const invitationLink = `${EnvSetup.invitationLink}?token=${token}&type=${type}`;
    return invitationLink;
  }

  async getAllUserFilters(req: Request) {
    const reqTemp: any = req;
    const filters = {isDeleted: false, isPlatform: {$ne: true}};
    switch (reqTemp.role) {
      case 'Super User':
        filters['role'] = {$ne: 'Super User'};
        break;
      default:
        filters['role'] = {$nin: ['Admin', 'Super User']};
        break;
    }
    if (req.query.search === 'true') {
      const text = req.body.text;
      if (text) {
        filters['$or'] = [
          {name: {$regex: text, $options: 'i'}},
          {email: {$regex: text, $options: 'i'}},
          {role: {$regex: text, $options: 'i'}},
          {SSID: {$regex: text, $options: 'i'}},
          {phone: {$regex: text, $options: 'i'}},
          {gender: {$regex: text, $options: 'i'}},
          {address: {$regex: text, $options: 'i'}},
        ];
      }
    }
    if (req.query.filter === 'true') {
      const filter = req.body.filter;
      if (filter && filter.dateOfBirth) {
        filters['dateOfBirth'] = {
          $gte: filter.dateOfBirth.start,
          $lte: filter.dateOfBirth.end,
        };
      }
      if (filter && typeof filter?.isActive === 'boolean') {
        filters['isActive'] = filter.isActive;
      }
    }
    return filters;
  }
}
export default new UserUtil();
