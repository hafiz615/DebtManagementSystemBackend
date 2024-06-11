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
import {v4 as uuidv4} from 'uuid';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import mongoose from 'mongoose';
class UserService {
  private userRepository: UserRepository;
  private tokenService: TokenService;
  private emailUtil: EmailUtil;
  private caseRepository: CaseRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenService = new TokenService();
    this.emailUtil = new EmailUtil();
    this.caseRepository = new CaseRepository();
  }

  async createUser(req: Request): Promise<[boolean, Partial<IUser> | string]> {
    let user = null;
    user = await this.userRepository.getOne<IUser>({
      $or: [{email: req.body.email.toLowerCase()}, {phone: req.body.phone}],
    });
    if (user && !user.isDeleted) {
      if (user.email === req.body.email.toLowerCase()) {
        return [false, constants.alreadyExistsMessage('Email')];
      }
      return [false, constants.alreadyExistsMessage('Phone')];
    }
    if (!user) {
      req.body.email = req.body.email.toLowerCase();
      const newUser = new User();
      const validatedUser = DataCopier.copy(newUser, req.body as IUser);
      user = await this.userRepository.create<IUser>(validatedUser);
      if (!user) {
        return [false, constants.failureRegisterMessage('User')];
      }
    }
    const token = await this.tokenService.createVerifyToken(user.email);
    const invitationLink = await userUtil.getInvitationLink(token);
    await this.emailUtil.sendInvitationLink(user, invitationLink);
    req.body.verifyToken = token;
    req.body.isDeleted = false;
    let updatedUser = await this.userRepository.updateById<IUser>(user._id, {
      ...req.body,
    });
    return [true, updatedUser];
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
    const uuid = uuidv4();
    const token = await this.tokenService.create(userExist._id, uuid);
    await this.userRepository.updateById<IUser>(userExist._id, {
      $push: {sessionIds: uuid},
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
    const bodyUser = req.body as IUser;
    delete bodyUser.isActive;
    delete bodyUser.password;
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
      isDeleted: true,
      isActive: false,
      password: '',
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
    const uuid = uuidv4();
    const token = await this.tokenService.create(findUser._id, uuid);
    user.sessionIds = [uuid];
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
      {role: {$ne: 'Admin'}, isDeleted: false},
      undefined,
      undefined,
      {createdAt: -1},
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

  signOut = async (req: Request): Promise<[boolean, IUser[] | string]> => {
    const reqTemp: any = req;
    const userId = reqTemp?.id;
    const sessionId = reqTemp?.sessionId;

    await this.userRepository.updateById<IUser>(userId, {
      $pull: {sessionIds: sessionId},
    });

    return [true, []];
  };

  async resetPassword(req: Request): Promise<[boolean, IUser | string]> {
    const {currentPassword, newPassword} = req.body;

    const reqTemp: any = req;
    const comparePassword = await userUtil.checkUserAndComparePassword(
      reqTemp.email,
      currentPassword
    );
    if (!comparePassword) return [false, 'Invalid password!'];
    const checkPassword = await userUtil.checkPassword(newPassword);
    if (!checkPassword)
      return [false, 'New ' + constants.Messages.PASSWORD_FORMAT];
    if (currentPassword === newPassword) {
      return [false, 'Current and new password are same'];
    }
    const hashPassword = await commonUtil.hashPassword(newPassword);
    const updateUser = await this.userRepository.updateById<IUser>(reqTemp.id, {
      password: hashPassword,
    });
    if (!updateUser) {
      return [false, constants.failureUpdateMessage('password')];
    }
    return [true, updateUser];
  }

  dashboard = async (req: Request): Promise<[boolean, ICase | string]> => {
    const reqTemp: any = req;
    const userId = reqTemp?.id;
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          $or: [
            {'caseOwner.id': userId},
            {'negotiator.id': userId},
            {'manager.id': userId},
          ],
        },
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'caseId',
          as: 'payments',
        },
      },
      {
        $unwind: {
          path: '$payments',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          caseCode: {$first: '$caseCode'},
          createdAt: {$first: '$createdAt'},
          remaining: {$first: '$remaining'},
          status: {$first: '$status'},
          successfulPayments: {
            $sum: {
              $cond: [{$eq: ['$payments.captured', 'Success']}, 1, 0],
            },
          },
          failedPayments: {
            $sum: {
              $cond: [{$eq: ['$payments.captured', 'Failed']}, 1, 0],
            },
          },
          successfulAuthorizations: {
            $sum: {
              $cond: [{$eq: ['$payments.authorized', 'Success']}, 1, 0],
            },
          },
          failedAuthorizations: {
            $sum: {
              $cond: [{$eq: ['$payments.authorized', 'Failed']}, 1, 0],
            },
          },
          totalCapturedAmount: {
            $sum: {
              $cond: [
                {$eq: ['$payments.captured', 'Success']},
                '$payments.amount',
                0,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          paidAmount: {$subtract: ['$remaining', '$totalCapturedAmount']},
        },
      },
      {
        $facet: {
          paymentStats: [
            {
              $group: {
                _id: null,
                totalSuccessfulPayments: {$sum: '$successfulPayments'},
                totalFailedPayments: {$sum: '$failedPayments'},
                totalSuccessfulAuthorizations: {
                  $sum: '$successfulAuthorizations',
                },
                totalFailedAuthorizations: {$sum: '$failedAuthorizations'},
              },
            },
            {
              $project: {
                _id: 0,
                totalSuccessfulPayments: 1,
                totalFailedPayments: 1,
                totalSuccessfulAuthorizations: 1,
                totalFailedAuthorizations: 1,
              },
            },
          ],
          casesByDate: [
            {
              $group: {
                _id: {$dateToString: {format: '%Y-%m-%d', date: '$createdAt'}},
                count: {$sum: 1},
              },
            },
            {
              $sort: {_id: 1},
            },
            {
              $project: {
                _id: 0,
                date: '$_id',
                count: 1,
              },
            },
          ],
          paidAmounts: [
            {
              $project: {
                _id: 0,
                caseCode: 1,
                paid: '$paidAmount',
              },
            },
          ],
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: {$sum: 1},
              },
            },
            {
              $project: {
                _id: 0,
                label: '$_id',
                count: 1,
              },
            },
            {
              $group: {
                _id: null,
                statuses: {
                  $push: {
                    k: '$label',
                    v: '$count',
                  },
                },
              },
            },
            {
              $addFields: {
                statuses: {
                  $arrayToObject: '$statuses',
                },
              },
            },
            {
              $addFields: {
                statuses: {
                  $mergeObjects: [
                    {
                      Canceled: 0,
                      Duplicate: 0,
                      'AF Customer': 0,
                      'Check Back': 0,
                      'Declared Bankrupcy': 0,
                      'On Hold': 0,
                      Graduated: 0,
                      Settled: 0,
                      'On Hold/Settled': 0,
                      '1st payment bounces': 0,
                      'Settled Owes Fees': 0,
                      'One Payment': 0,
                    },
                    '$statuses',
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                statuses: {
                  $objectToArray: '$statuses',
                },
              },
            },
            {
              $unwind: '$statuses',
            },
            {
              $project: {
                label: '$statuses.k',
                count: '$statuses.v',
              },
            },
          ],
        },
      },
    ];

    const result: any =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    if (!result.length) {
      return [false, 'Unable to return analytics!'];
    }
    return [true, result[0]];
  };
}

export default UserService;
