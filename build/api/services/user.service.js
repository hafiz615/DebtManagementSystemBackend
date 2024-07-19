"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const token_service_1 = __importDefault(require("./token.service"));
const lodash_1 = require("lodash");
const user_repository_1 = require("../repository/user/user.repository");
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const common_util_1 = __importDefault(require("../../utils/common.util"));
const user_util_1 = __importDefault(require("../../utils/user.util"));
const user_repomodel_1 = require("../../database/repomodels/user.repomodel");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const email_util_1 = __importDefault(require("../../utils/email.util"));
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const uuid_1 = require("uuid");
const case_repository_1 = require("../repository/case/case.repository");
class UserService {
    constructor() {
        this.getAllUsers = async (req) => {
            const filters = await user_util_1.default.getAllUserFilters(req);
            let users = await this.userRepository.getAll(filters, undefined, undefined, { createdAt: -1 }, undefined, undefined, Number(req.query.page), Number(req.query.limit));
            const count = await this.userRepository.getCount(filters);
            if (!users.length) {
                return [false, constants_util_2.default.notFoundMessage('Users')];
            }
            return [true, { users: users, totalUsers: count }];
        };
        this.signOut = async (req) => {
            const reqTemp = req;
            const userId = reqTemp?.id;
            const sessionId = reqTemp?.sessionId;
            await this.userRepository.updateById(userId, {
                $pull: { sessionIds: sessionId },
            });
            return [true, []];
        };
        this.dashboard = async (req, keyword) => {
            const reqTemp = req;
            const userId = reqTemp?.id;
            let startDate = null, endDate = null;
            if (req.query.filter === 'true') {
                const filter = req.body.filter;
                if (filter.date) {
                    startDate = filter.date.start;
                    endDate = filter.date.end;
                }
            }
            let match = {
                isDeleted: { $ne: true },
            };
            if (keyword === 'viewAnalyticsForSelf') {
                match['$or'] = [
                    { caseOwnerId: userId },
                    { negotiatorId: userId },
                    { managerId: userId },
                ];
            }
            const pipeline = [
                {
                    $match: match,
                },
                ...(startDate && endDate
                    ? [
                        {
                            $match: {
                                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
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
                                    { payments: { $eq: [] } }, // Include cases without payments
                                ],
                            },
                        },
                    ]
                    : []),
                {
                    $group: {
                        _id: '$_id',
                        caseCode: { $first: '$caseCode' },
                        createdAt: { $first: '$createdAt' },
                        remaining: { $first: '$remaining' },
                        status: { $first: '$status' },
                        successfulPayments: {
                            $sum: {
                                $cond: [{ $eq: ['$payments.captured', 'Success'] }, 1, 0],
                            },
                        },
                        failedPayments: {
                            $sum: {
                                $cond: [{ $eq: ['$payments.captured', 'Failed'] }, 1, 0],
                            },
                        },
                        successfulAuthorizations: {
                            $sum: {
                                $cond: [{ $eq: ['$payments.authorized', 'Success'] }, 1, 0],
                            },
                        },
                        failedAuthorizations: {
                            $sum: {
                                $cond: [{ $eq: ['$payments.authorized', 'Failed'] }, 1, 0],
                            },
                        },
                        totalCapturedAmount: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$payments.captured', 'Success'] },
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
                                if: { $eq: ['$remaining', 0] },
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
                                    totalSuccessfulPayments: { $sum: '$successfulPayments' },
                                    totalFailedPayments: { $sum: '$failedPayments' },
                                    totalSuccessfulAuthorizations: {
                                        $sum: '$successfulAuthorizations',
                                    },
                                    totalFailedAuthorizations: { $sum: '$failedAuthorizations' },
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
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                                    count: { $sum: 1 },
                                },
                            },
                            {
                                $sort: { _id: 1 },
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
                            { $sort: { caseCode: 1 } }, // Ensure consistent ordering by caseCode
                        ],
                        statusCounts: [
                            {
                                $group: {
                                    _id: '$status',
                                    count: { $sum: 1 },
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
            const result = await this.caseRepository.applyAggregate(pipeline);
            if (!result.length) {
                return [false, 'Unable to return analytics!'];
            }
            return [true, result[0]];
        };
        this.userRepository = new user_repository_1.UserRepository();
        this.tokenService = new token_service_1.default();
        this.emailUtil = new email_util_1.default();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async createUser(req) {
        let user = null;
        user = await this.userRepository.getOne({
            $or: [{ email: req.body.email.toLowerCase() }, { phone: req.body.phone }],
        });
        if (user && !user.isDeleted) {
            if (user.email === req.body.email.toLowerCase()) {
                return [false, constants_util_1.default.alreadyExistsMessage('Email')];
            }
            return [false, constants_util_1.default.alreadyExistsMessage('Phone')];
        }
        if (!user) {
            req.body.email = req.body.email.toLowerCase();
            const newUser = new user_repomodel_1.User();
            const validatedUser = dataCopier_util_1.DataCopier.copy(newUser, req.body);
            user = await this.userRepository.create(validatedUser);
            if (!user) {
                return [false, constants_util_1.default.failureRegisterMessage('User')];
            }
        }
        const token = await this.tokenService.createVerifyToken(user.email);
        const invitationLink = await user_util_1.default.getInvitationLink(token);
        await this.emailUtil.sendInvitationLink(user, invitationLink);
        req.body.verifyToken = token;
        req.body.isDeleted = false;
        let updatedUser = await this.userRepository.updateById(user._id, {
            ...req.body,
        });
        return [true, updatedUser];
    }
    async signIn(email, password) {
        const userExist = await user_util_1.default.checkUserAndComparePassword(email.toLowerCase(), password);
        if (!userExist)
            return [false, constants_util_1.default.Messages.INVALID];
        const uuid = (0, uuid_1.v4)();
        const token = await this.tokenService.create(userExist._id, uuid);
        await this.userRepository.updateById(userExist._id, {
            $push: { sessionIds: uuid },
        });
        return [
            true,
            {
                user: (0, lodash_1.omit)(JSON.parse(JSON.stringify(userExist)), 'password'),
                token: token,
            },
        ];
    }
    async getUserById(id) {
        const user = await this.userRepository.getById(id);
        if (!user) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        return [true, user];
    }
    async getUser(email) {
        const user = await this.userRepository.getOne({ email: email });
        if (!user) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        return [true, user];
    }
    async updateUser(req) {
        const bodyUser = req.body;
        delete bodyUser.isActive;
        delete bodyUser.password;
        const user = await this.userRepository.updateByOne({ email: req.body.email }, { ...bodyUser });
        if (!user) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        return [true, user];
    }
    async deleteUserById(id) {
        const user = await this.userRepository.updateById(id, {
            isDeleted: true,
            isActive: false,
            password: '',
        });
        if (!user) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        return [true, user];
    }
    async verifyInvitationLink(token) {
        const validate = authorize_middleware_1.default.validateVerifyToken(token);
        if (!validate) {
            return [false, constants_util_1.default.Messages.INVALID_LINK];
        }
        const user = await this.userRepository.getOne({ verifyToken: token });
        if (!user) {
            return [false, constants_util_1.default.Messages.INVALID_LINK];
        }
        return [true, user];
    }
    async resendInvitationLink(email) {
        const user = await this.userRepository.getOne({ email: email });
        if (!user) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        const token = await this.tokenService.createVerifyToken(user.email);
        const invitationLink = await user_util_1.default.getInvitationLink(token);
        await this.emailUtil.sendInvitationLink(user, invitationLink);
        await this.userRepository.updateById(user._id, {
            verifyToken: token,
        });
        return [true, user];
    }
    async updatePassword(req) {
        const findUser = await this.userRepository.getOne({
            verifyToken: req.query.token,
        });
        if (!findUser)
            return [false, constants_util_1.default.notFoundMessage('User')];
        const checkPassword = await user_util_1.default.checkPassword(req.body.password);
        if (!checkPassword)
            return [false, constants_util_1.default.Messages.PASSWORD_FORMAT];
        req.body.password = await common_util_1.default.hashPassword(req.body.password);
        let user = req.body;
        user.isActive = true;
        user.verifyToken = '';
        const uuid = (0, uuid_1.v4)();
        const token = await this.tokenService.create(findUser._id, uuid);
        user.sessionIds = [uuid];
        const updatedUser = await this.userRepository.updateByOne({ email: req.body.email }, { ...user });
        if (!updatedUser) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        return [true, { user: updatedUser, token: token }];
    }
    async resetPassword(req) {
        const { currentPassword, newPassword } = req.body;
        const reqTemp = req;
        const comparePassword = await user_util_1.default.checkUserAndComparePassword(reqTemp.email, currentPassword);
        if (!comparePassword)
            return [false, 'Invalid password!'];
        const checkPassword = await user_util_1.default.checkPassword(newPassword);
        if (!checkPassword)
            return [false, 'New ' + constants_util_1.default.Messages.PASSWORD_FORMAT];
        if (currentPassword === newPassword) {
            return [false, 'Current and new password are same'];
        }
        const hashPassword = await common_util_1.default.hashPassword(newPassword);
        const updateUser = await this.userRepository.updateById(reqTemp.id, {
            password: hashPassword,
        });
        if (!updateUser) {
            return [false, constants_util_1.default.failureUpdateMessage('password')];
        }
        return [true, updateUser];
    }
}
exports.default = UserService;
//# sourceMappingURL=user.service.js.map