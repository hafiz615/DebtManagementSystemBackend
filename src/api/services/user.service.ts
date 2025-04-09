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
import emailUtil from '../../utils/email.util';
import client from '@sendgrid/client';
import {ClientRequest} from '@sendgrid/client/src/request';
import {compare} from 'bcryptjs';
import dotenv from 'dotenv';
import caseUtil from '../../utils/case.util';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {SignatureRepository} from '../repository/signature/signature.repository';
import {ISignature} from '../../database/interfaces/signature.interface';
import {Signature} from '../../database/repomodels/signature.repomodel';
dotenv.config();
class UserService {
  private userRepository: UserRepository;
  private tokenService: TokenService;
  private caseRepository: CaseRepository;
  private debtorRepository: DebtorRepository;
  private signatureRepository: SignatureRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenService = new TokenService();
    this.caseRepository = new CaseRepository();
    this.debtorRepository = new DebtorRepository();
    this.signatureRepository = new SignatureRepository();
    client.setApiKey(process.env.SENDGRID_API_KEY as string);
  }

  async createUser(req: Request): Promise<[boolean, Partial<IUser> | string]> {
    let user = null;
    const email = req.body.email.toLowerCase();
    user = await this.userRepository.getOne<IUser>({
      $or: [{email: email}, {phone: req.body.phone}, {SSID: req.body.SSID}],
    });
    if (user && !user.isDeleted) {
      if (user.email === email) {
        return [false, constants.alreadyExistsMessage('Email')];
      }
      if (user.SSID === req.body.SSID) {
        return [false, constants.alreadyExistsMessage('SSN')];
      }
      return [false, constants.alreadyExistsMessage('Phone')];
    }
    if (!user) {
      req.body.email = email;
      const newUser = new User();
      const validatedUser = DataCopier.copy(newUser, req.body as IUser);
      user = await this.userRepository.create<IUser>(validatedUser);
      if (!user) {
        return [false, constants.failureRegisterMessage('User')];
      }
    }
    const token = await this.tokenService.createVerifyToken(
      email,
      process.env.verifyKey!,
      process.env.jwtExpire
    );
    req.body.verifyToken = token;
    req.body.isDeleted = false;
    req.body.updatedAt = commonUtil.getCurrentDate();
    let updatedUser = await this.userRepository.updateById<IUser>(user._id, {
      ...req.body,
    });
    if (!updatedUser) {
      return [false, constants.failureRegisterMessage('User')];
    }
    const invitationLink = await userUtil.getInvitationLink(token, 'update');
    await emailUtil.sendInvitationLink(updatedUser, invitationLink);

    return [true, updatedUser];
  }

  async signIn(
    email: string,
    password: string
  ): Promise<[boolean, {user: Partial<IUser>; token: string} | string]> {
    console.log('i am in sign in');
    const userExist = await userUtil.checkUserAndComparePassword(
      email.toLowerCase(),
      password
    );
    if (!userExist) return [false, constants.Messages.INVALID];
    const uuid = uuidv4();
    const token = await this.tokenService.create(
      userExist._id,
      uuid,
      process.env.jwtExpire
    );
    await this.userRepository.updateById<IUser>(userExist._id, {
      $push: {sessionIds: uuid},
      updatedAt: commonUtil.getCurrentDate(),
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

  async getUsersByRole(): Promise<[boolean, {[key: string]: string[]}]> {
    const users: IUser[] = await this.userRepository.getAll({});

    const predefinedRoles = [
      'Negotiator',
      'CSM',
      'Payment Department',
      'Manager',
    ];

    const usersByRole = users.reduce(
      (acc: {[key: string]: string[]}, curr: IUser) => {
        if (predefinedRoles.includes(curr.role)) {
          acc[curr.role] = acc[curr.role] || [];
          acc[curr.role].push(curr.email);
        }
        return acc;
      },
      Object.fromEntries(predefinedRoles.map(role => [role, []])) as {
        [key: string]: string[];
      }
    );

    return [true, usersByRole];
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
      {...bodyUser, updatedAt: commonUtil.getCurrentDate()}
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
      updatedAt: commonUtil.getCurrentDate(),
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
    if (user.isActive) {
      return [false, 'Could not send invitation link to active user'];
    }
    const token = await this.tokenService.createVerifyToken(
      user.email,
      process.env.verifyKey!,
      process.env.jwtExpire
    );
    const invitationLink = await userUtil.getInvitationLink(token, 'update');
    await emailUtil.sendInvitationLink(user, invitationLink);
    await this.userRepository.updateById<IUser>(user._id, {
      verifyToken: token,
      updatedAt: commonUtil.getCurrentDate(),
    });
    return [true, user];
  }

  async forgotPasswordLink(email: string): Promise<[boolean, IUser | string]> {
    const user = await this.userRepository.getOne<IUser>({email: email});
    if (!user) {
      return [false, constants.notFoundMessage('User')];
    }
    if (!user.isActive) {
      return [false, 'Inactive users cannot do forgot password'];
    }
    const token = await this.tokenService.createVerifyToken(
      user.email,
      process.env.verifyKey!,
      process.env.jwtExpire
    );
    const updateUser = await this.userRepository.updateById<IUser>(user._id, {
      verifyToken: token,
      updatedAt: commonUtil.getCurrentDate(),
    });
    if (!updateUser) {
      return [false, constants.notFoundMessage('User')];
    }
    const invitationLink = await userUtil.getInvitationLink(token, 'forgot');
    const text = `Dear ${user.name},

    You've requested to reset your password. To proceed, please click the link below to set a new password:

    ${invitationLink}

    If you didn't request this, you can safely ignore this email. Your account will remain secure.

   Thank you,
   Debt-Settlement Team`;
    await emailUtil.sendLink(user, text, constantsUtil.FORGOT_PASSWORD_SUBJECT);
    return [true, 'Reset password link sent successfully'];
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
    const token = await this.tokenService.create(
      findUser._id,
      uuid,
      process.env.jwtExpire
    );
    user.sessionIds = [uuid];
    const updatedUser = await this.userRepository.updateByOne<IUser>(
      {email: req.body.email},
      {...user, updatedAt: commonUtil.getCurrentDate()}
    );
    if (!updatedUser) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, {user: updatedUser, token: token}];
  }

  getAllUsers = async (req: Request): Promise<[boolean, {} | string]> => {
    const filters = await userUtil.getAllUserFilters(req);
    let users = await this.userRepository.getAll<IUser>(
      filters,
      undefined,
      undefined,
      {createdAt: -1},
      undefined,
      undefined,
      Number(req.query.page),
      Number(req.query.limit)
    );
    const count = await this.userRepository.getCount<IUser>(filters);
    if (!users.length) {
      return [false, constantsUtil.notFoundMessage('Users')];
    }
    return [true, {users: users, totalUsers: count}];
  };

  signOut = async (req: Request): Promise<[boolean, IUser[] | string]> => {
    const reqTemp: any = req;
    const userId = reqTemp?.id;
    const sessionId = reqTemp?.sessionId;

    await this.userRepository.updateById<IUser>(userId, {
      $pull: {sessionIds: sessionId},
      updatedAt: commonUtil.getCurrentDate(),
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
      updatedAt: commonUtil.getCurrentDate(),
    });
    if (!updateUser) {
      return [false, constants.failureUpdateMessage('password')];
    }
    return [true, updateUser];
  }

  dashboard = async (
    req: Request,
    keyword: string
  ): Promise<[boolean, ICase | string]> => {
    const reqTemp: any = req;
    const userId = reqTemp?.id;
    let startDate = null,
      endDate = null;
    if (req.query.filter === 'true') {
      const filter = req.body.filter;
      if (filter.date) {
        startDate = filter.date.start;
        endDate = filter.date.end;
      }
    }
    let match = {
      isDeleted: {$ne: true},
    };
    if (keyword === 'viewAnalyticsForSelf') {
      match['$or'] = [
        {caseOwnerId: userId},
        {negotiatorId: userId},
        {managerId: userId},
      ];
    }
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: match,
      },
      ...(startDate && endDate
        ? [
            {
              $match: {
                createdAt: {$gte: new Date(startDate), $lte: new Date(endDate)},
              },
            },
          ]
        : []),
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
      ...(startDate && endDate
        ? [
            {
              $match: {
                $or: [
                  {
                    'payments.dueDate': {
                      $gte: new Date(startDate),
                      $lte: new Date(endDate),
                    },
                  },
                  {payments: {$eq: []}}, // Include cases without payments
                ],
              },
            },
          ]
        : []),
      {
        $group: {
          _id: '$_id',
          caseCode: {$first: '$caseCode'},
          createdAt: {$first: '$createdAt'},
          remaining: {$first: '$remaining'},
          status: {$first: '$status'},
          successfulPayments: {
            $sum: {
              $cond: [{$eq: ['$payments.status', 'Success']}, 1, 0],
            },
          },
          successfulCaptures: {
            $sum: {
              $cond: [{$eq: ['$payments.captured', 'Success']}, 1, 0],
            },
          },
          failedCaptures: {
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
                {$eq: ['$payments.status', 'Success']},
                '$payments.amount',
                0,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          paidAmount: {
            $cond: {
              if: {$eq: ['$remaining', 0]},
              then: 0, // or null, or any other appropriate value
              else: {
                $multiply: [
                  {
                    $divide: ['$totalCapturedAmount', '$remaining'],
                  },
                  100,
                ],
              },
            },
          },
        },
      },
      {
        $facet: {
          paymentStats: [
            {
              $group: {
                _id: null,
                totalSuccessfulPayments: {$sum: '$successfulPayments'},
                totalFailedCaptures: {$sum: '$failedCaptures'},
                totalSuccessfulAuthorizations: {
                  $sum: '$successfulAuthorizations',
                },
                totalFailedAuthorizations: {$sum: '$failedAuthorizations'},
                totalSuccessfulCaptures: {$sum: '$successfulCaptures'},
              },
            },
            {
              $project: {
                _id: 0,
                totalSuccessfulPayments: 1,
                totalFailedCaptures: 1,
                totalSuccessfulAuthorizations: 1,
                totalFailedAuthorizations: 1,
                totalSuccessfulCaptures: 1,
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
                paidPercentage: '$paidAmount',
              },
            },
            {$sort: {caseCode: 1}}, // Ensure consistent ordering by caseCode
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

  async addSenderIdentity(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const data = {
      from_email: req.body.from_email,
      reply_to: req.body.from_email,
      from_name: req.body.from_name,
      address: req.body.address,
      city: req.body.city,
    };
    data['country'] = 'USA';
    data['nickname'] = `debtor-${req.params.id}-${new Date().getSeconds()}`;
    const request: ClientRequest = {
      url: `/v3/verified_senders`,
      method: 'POST',
      body: data,
    };

    const result = await client.request(request);
    return [true, []];
  }

  async verifySenderIdentity(req: Request) {
    const url = req.body.url;
    const decodedUrl = decodeURIComponent(url);
    const splitArray = decodedUrl.split('?');
    const queryString = splitArray[splitArray.length - 1];
    const token = new URLSearchParams(queryString).get('token');
    const request: ClientRequest = {
      url: `/v3/verified_senders/verify/${token}`,
      method: 'GET',
    };

    const result = await client.request(request);
    return [true, []];
  }

  async getVerifySenders(req: Request) {
    const reqTemp: any = req;
    const request: ClientRequest = {
      url: `/v3/verified_senders`,
      method: 'GET',
    };

    const result: any = await client.request(request);
    let emails = [];
    for (const item of result[0].body.results) {
      if (item.verified) {
        if (item.nickname.includes(req.params.id)) emails.push(item.from_email);
        if (item.nickname.includes(reqTemp.id)) emails.push(item.from_email);
      }
    }
    if (!emails.includes(reqTemp.email)) {
      const email = result[0].body.results
        .filter(
          item => item.from_email === reqTemp.email && item.verified === true
        )
        .map(item => item.from_email);
      if (email.length) emails.push(...email);
    }
    return [true, emails];
  }

  async forgotPasswordUpdate(req: Request): Promise<[boolean, IUser | string]> {
    const findUser = await this.userRepository.getOne<IUser>(
      {
        verifyToken: req.query.token,
      },
      '+password'
    );
    if (!findUser) return [false, constants.notFoundMessage('User')];
    const checkPassword = await userUtil.checkPassword(req.body.password);
    if (!checkPassword) return [false, constants.Messages.PASSWORD_FORMAT];
    if (await compare(req.body.password, findUser.password)) {
      return [false, 'Password already in use. Please enter new password'];
    }
    req.body.password = await commonUtil.hashPassword(req.body.password);
    let user = req.body as IUser;
    user.verifyToken = '';
    const updatedUser = await this.userRepository.updateByOne<IUser>(
      {email: req.body.email},
      {...user, updatedAt: commonUtil.getCurrentDate()}
    );
    if (!updatedUser) {
      return [false, constants.notFoundMessage('User')];
    }
    return [true, 'Password reset successfully'];
  }

  async thirdPartySignIn(req: Request) {
    req.body.email = req.body.email.toLowerCase();
    req.body.role = 'Debtor';
    const email = req.body.email;
    let user = await this.userRepository.getOne<IUser>({
      email: email,
      isDeleted: false,
    });
    if (user && !user.isPlatform) {
      return [false, constants.alreadyExistsMessage('User')];
    }
    if (!user) {
      req.body.phone = await commonUtil.cleanPhoneNumber(req.body.phone);
      req.body.isActive = true;
      req.body.isPlatform = true;
      const newUser = new User();
      const validatedUser = DataCopier.copy(newUser, req.body as IUser);
      user = await this.userRepository.create(validatedUser);
    }
    if (user.isDeleted) {
      return [false, constants.failureRegisterMessage('User')];
    }
    const uuid = uuidv4();
    const token = await this.tokenService.create(
      user._id,
      uuid,
      process.env.jwtExpire
    );
    await this.userRepository.updateById<IUser>(user._id, {
      $push: {sessionIds: uuid},
      updatedAt: commonUtil.getCurrentDate(),
    });
    return [true, {user, token: token}];
  }

  async addUserSender(req: Request) {
    const email = req.body.from_email.toLowerCase();
    const findUser = await this.userRepository.getOne<IUser>({
      email: email,
      isActive: true,
    });
    if (!findUser)
      return [
        false,
        'This user is not registered on First Choice Debt Solutions',
      ];
    const reqTemp: any = req;
    const data = {
      from_email: email,
      reply_to: email,
      from_name: req.body.from_name,
      address: req.body.address,
      city: req.body.city,
    };
    data['country'] = 'USA';
    data['nickname'] = `user-${reqTemp.id}-${new Date().getSeconds()}`;
    const request: ClientRequest = {
      url: `/v3/verified_senders`,
      method: 'POST',
      body: data,
    };

    const result = await client.request(request);
    return [true, []];
  }

  getUsers = async (req: Request) => {
    const reqTemp: any = req;
    const filters = {isDeleted: false, isPlatform: {$ne: true}};
    if (reqTemp.role !== 'Super User') {
      filters['role'] = {$ne: 'Super User'};
    }
    let users = await this.userRepository.getAllWithoutPagination<IUser>(
      filters,
      'name',
      undefined,
      {createdAt: -1}
    );
    if (!users.length) {
      return [false, constantsUtil.notFoundMessage('Users')];
    }
    users = await this.moveObjectToTop(users, reqTemp.id);
    return [true, users];
  };

  async moveObjectToTop(data: IUser[], id: string) {
    const index = data.findIndex(item => String(item._id) === id);

    if (index > 0) {
      const [objectToMove] = data.splice(index, 1);
      data.unshift(objectToMove);
    }
    return data;
  }

  async addSignature(req: Request) {
    const reqTemp: any = req;
    const signature = new Signature();
    signature.signature = req.body.signature;
    signature.userId = reqTemp.id;
    const result = await this.signatureRepository.create<ISignature>(signature);
    if (!result) return [false, constants.failureAddMessage('signature')];
    return [true, []];
  }

  async getSignatures(req: Request) {
    const reqTemp: any = req;
    const result =
      await this.signatureRepository.getAllWithoutPagination<ISignature>({
        userId: reqTemp.id,
        isDeleted: false,
      });
    if (!result) return [false, constants.notFoundMessage('signatures')];
    return [true, result];
  }

  async updateSignature(req: Request) {
    const result = await this.signatureRepository.updateById<ISignature>(
      req.params.id,
      {signature: req.body.signature}
    );
    if (!result) return [false, constants.failureUpdateMessage('signature')];
    return [true, result];
  }

  async deleteSignature(req: Request) {
    const result = await this.signatureRepository.updateById<ISignature>(
      req.params.id,
      {isDeleted: true, active: false}
    );
    if (!result) return [false, constants.failureDeleteMessage('signature')];
    return [true, result];
  }

  async updateSignatureStatus(req: Request) {
    const reqTemp: any = req;
    if (req.body.active) {
      await this.signatureRepository.updateMany<ISignature>(
        {userId: reqTemp.id, active: true},
        {active: false}
      );
    }
    const result = await this.signatureRepository.updateById<ISignature>(
      req.params.id,
      {active: req.body.active}
    );
    if (!result) return [false, constants.failureUpdateMessage('signature')];
    return [true, result];
  }

  async getUserActiveSignature(req: Request) {
    const reqTemp: any = req;
    const result = await this.signatureRepository.getOne<ISignature>({
      active: true,
      userId: reqTemp.id,
      isDeleted: false,
    });
    if (!result) return [false, constants.notFoundMessage('signature')];
    return [true, result];
  }
}

export default UserService;
