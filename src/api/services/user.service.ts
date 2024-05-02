import {Request} from 'express';
import {IUser} from '../../database/interfaces/user.interface';
import TokenService from './token.service';
import {omit} from 'lodash';
import {UserRepository} from '../repository/user/user.repository';
import constants from '../../utils/constants.util';
import GlobalVariables from '../../global';
import commonUtil from '../../utils/common.util';
import userUtil from '../../utils/user.util';

class UserService {
  private userRepository: UserRepository;
  private tokenService: TokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenService = new TokenService();
  }

  async signIn(
    email: string,
    password: string
  ): Promise<[boolean, {user: Partial<IUser>; token: string} | string]> {
    const userExist = await userUtil.checkUserAndComparePassword(
      email,
      password
    );
    if (!userExist) return [false, constants.Messages.INVALID];
    const token = await this.tokenService.create(userExist._id);
    await this.userRepository.updateById<IUser>(userExist._id, {
      token: token,
    });
    return [
      true,
      {
        user: omit(JSON.parse(JSON.stringify(userExist)), 'password'),
        token: token,
      },
    ];
  }

  async getUserById(): Promise<[boolean, IUser | string]> {
    const user = await this.userRepository.getById<IUser>(
      GlobalVariables.userId
    );
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, user];
  }

  async getUser(email: string): Promise<[boolean, IUser | string]> {
    const user = await this.userRepository.getOne<IUser>({email: email});
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, user];
  }

  async updateUser(req: Request): Promise<[boolean, IUser | string]> {
    const checkPassword = await userUtil.checkPassword(req.body.password);
    if (!checkPassword) return [false, constants.Messages.PASSWORD_FORMAT];
    req.body.password = await commonUtil.hashPassword(req.body.password);
    const user = await this.userRepository.updateUserByIdOrEmail(
      req.body.email,
      req.body as IUser
    );
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, user];
  }

  async deleteUserById(): Promise<[boolean, IUser | string]> {
    const user = await this.userRepository.updateById<IUser>(
      GlobalVariables.userId,
      {
        isActive: false,
      }
    );
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, user];
  }
}

export default UserService;
