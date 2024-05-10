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
class UserService {
    constructor() {
        this.getAllUsers = async (req) => {
            let users = await this.userRepository.getAll({ role: { $ne: 'Admin' } }, undefined, undefined, undefined, undefined, undefined, Number(req.query.page), Number(req.query.limit));
            if (!users.length) {
                return [false, constants_util_2.default.notFoundMessage('Users')];
            }
            return [true, users];
        };
        this.userRepository = new user_repository_1.UserRepository();
        this.tokenService = new token_service_1.default();
        this.emailUtil = new email_util_1.default();
    }
    async createUser(req) {
        const userExist = await this.userRepository.getOne({
            $or: [{ email: req.body.email.toLowerCase() }, { phone: req.body.phone }],
        });
        if (userExist) {
            return [false, constants_util_1.default.alreadyExistsMessage('User')];
        }
        req.body.email = req.body.email.toLowerCase();
        const newUser = new user_repomodel_1.User();
        const validatedUser = dataCopier_util_1.DataCopier.copy(newUser, req.body);
        console.log(validatedUser);
        const user = await this.userRepository.create(validatedUser);
        if (!user) {
            return [false, constants_util_1.default.failureRegisterMessage('User')];
        }
        const token = await this.tokenService.createVerifyToken(user.email);
        const invitationLink = await user_util_1.default.getInvitationLink(token);
        await this.emailUtil.sendInvitationLink(user, invitationLink);
        await this.userRepository.updateById(user._id, {
            verifyToken: token,
        });
        return [true, (0, lodash_1.omit)(user.toJSON(), 'password', 'jwtToken', 'verifyToken')];
    }
    async signIn(email, password) {
        const userExist = await user_util_1.default.checkUserAndComparePassword(email.toLowerCase(), password);
        if (!userExist)
            return [false, constants_util_1.default.Messages.INVALID];
        const token = await this.tokenService.create(userExist._id);
        await this.userRepository.updateById(userExist._id, {
            jwtToken: token,
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
        if (req.body.password) {
            const checkPassword = await user_util_1.default.checkPassword(req.body.password);
            if (!checkPassword)
                return [false, constants_util_1.default.Messages.PASSWORD_FORMAT];
            req.body.password = await common_util_1.default.hashPassword(req.body.password);
        }
        const bodyUser = req.body;
        const user = await this.userRepository.updateByOne({ email: req.body.email }, { ...bodyUser });
        if (!user) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        return [true, user];
    }
    async deleteUserById(id) {
        const user = await this.userRepository.updateById(id, {
            isActive: false,
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
        console.log(user, 'userrrrrrrrr');
        const updatedUser = await this.userRepository.updateByOne({ email: req.body.email }, { ...user });
        console.log(updatedUser);
        if (!updatedUser) {
            return [false, constants_util_1.default.notFoundMessage('User')];
        }
        return [true, updatedUser];
    }
}
exports.default = UserService;
//# sourceMappingURL=user.service.js.map