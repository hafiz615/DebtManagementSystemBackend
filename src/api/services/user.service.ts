import {Request} from 'express';
import {IUser} from '../../database/interfaces/user.interface';
import TokenService from './token.service';
import {omit} from 'lodash';
import {UserRepository} from '../repository/user/user.repository';
import constants from '../../utils/constants.util';
import commonUtil from '../../utils/common.util';
import userUtil from '../../utils/user.util';
import {User} from '../../database/repomodels/user.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';
import EmailUtil from '../../utils/email.util';
import authorize from '../../middleware/authorize.middleware';
import constantsUtil from '../../utils/constants.util';

class UserService {
  private userRepository: UserRepository;
  private tokenService: TokenService;
  private emailUtil: EmailUtil;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenService = new TokenService();
    this.emailUtil = new EmailUtil();
  }

  async createUser(req: Request): Promise<[boolean, Partial<IUser> | string]> {
    const userExist = await this.userRepository.getOne<IUser>({
      $or: [{email: req.body.email.toLowerCase()}, {phone: req.body.phone}],
    });
    if (userExist) {
      return [false, constants.alreadyExistsMessage('User')];
    }
    req.body.email = req.body.email.toLowerCase();
    const newUser = new User();
    const validatedUser = DataCopier.copy(newUser, req.body as IUser);
    const user = await this.userRepository.create<IUser>(validatedUser);
    if (!user) {
      return [false, constants.failureRegisterMessage('User')];
    }
    const token = await this.tokenService.createVerifyToken(user.email);
    const invitationLink = await userUtil.getInvitationLink(token);
    await this.emailUtil.sendInvitationLink(user, invitationLink);
    await this.userRepository.updateById<IUser>(user._id, {
      verifyToken: token,
    });
    return [true, omit(user.toJSON(), 'password', 'jwtToken', 'verifyToken')];
  }

  async signIn(
    email: string,
    password: string
  ): Promise<[boolean, {user: Partial<IUser>; token: string} | string]> {
    const userExist = await userUtil.checkUserAndComparePassword(
      email.toLowerCase(),
      password
    );
    if (!userExist) return [false, constants.Messages.INVALID];
    const token = await this.tokenService.create(userExist._id);
    await this.userRepository.updateById<IUser>(userExist._id, {
      jwtToken: token,
    });
    return [
      true,
      {
        user: omit(JSON.parse(JSON.stringify(userExist)), 'password'),
        token: token,
      },
    ];
  }

  async getUserById(id: string): Promise<[boolean, IUser | string]> {
    const user = await this.userRepository.getById<IUser>(id);
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
    if (req.body.password) {
      const checkPassword = await userUtil.checkPassword(req.body.password);
      if (!checkPassword) return [false, constants.Messages.PASSWORD_FORMAT];
      req.body.password = await commonUtil.hashPassword(req.body.password);
    }
    const bodyUser = req.body as IUser;
    delete bodyUser.isActive;
    const user = await this.userRepository.updateByOne<IUser>(
      {email: req.body.email},
      {...bodyUser}
    );
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, user];
  }

  async deleteUserById(id: string): Promise<[boolean, IUser | string]> {
    const user = await this.userRepository.updateById<IUser>(id, {
      isActive: false,
    });
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, user];
  }

  async verifyInvitationLink(
    token: string
  ): Promise<[boolean, IUser | string]> {
    const validate = authorize.validateVerifyToken(token);
    if (!validate) {
      return [false, constants.Messages.INVALID_LINK];
    }
    const user = await this.userRepository.getOne<IUser>({verifyToken: token});
    if (!user) {
      return [false, constants.Messages.INVALID_LINK];
    }
    return [true, user];
  }

  async resendInvitationLink(
    email: string
  ): Promise<[boolean, IUser | string]> {
    const user = await this.userRepository.getOne<IUser>({email: email});
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    const token = await this.tokenService.createVerifyToken(user.email);
    const invitationLink = await userUtil.getInvitationLink(token);
    await this.emailUtil.sendInvitationLink(user, invitationLink);
    await this.userRepository.updateById<IUser>(user._id, {
      verifyToken: token,
    });
    return [true, user];
  }

  async updatePassword(
    req: Request
  ): Promise<[boolean, {user: IUser; token: string} | string]> {
    const findUser = await this.userRepository.getOne<IUser>({
      verifyToken: req.query.token,
    });
    if (!findUser) return [false, constants.notFoundMessage('User')];
    const checkPassword = await userUtil.checkPassword(req.body.password);
    if (!checkPassword) return [false, constants.Messages.PASSWORD_FORMAT];
    req.body.password = await commonUtil.hashPassword(req.body.password);
    let user = req.body as IUser;
    user.isActive = true;
    user.verifyToken = '';
    const token = await this.tokenService.create(findUser._id);
    user.jwtToken = token;
    const updatedUser = await this.userRepository.updateByOne<IUser>(
      {email: req.body.email},
      {...user}
    );
    if (!updatedUser) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, {user: updatedUser, token: token}];
  }

  getAllUsers = async (req: Request): Promise<[boolean, IUser[] | string]> => {
    let users = await this.userRepository.getAll<IUser>(
      {role: {$ne: 'Admin'}},
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      Number(req.query.page),
      Number(req.query.limit)
    );
    if (!users.length) {
      return [false, constantsUtil.notFoundMessage('Users')];
    }
    return [true, users];
  };
}

export default UserService;
