"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = require("bcryptjs");
const user_repository_1 = require("../api/repository/user/user.repository");
const common_util_1 = __importDefault(require("./common.util"));
const constants_util_1 = __importDefault(require("./constants.util"));
class UserUtil {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    async checkPassword(password) {
        const checkPass = common_util_1.default.checkPasswordRegex(password);
        if (!checkPass) {
            return false;
        }
        return true;
    }
    async checkUserAndComparePassword(email, password) {
        const userExist = await this.userRepository.getOne({ email }, '+password');
        if (!userExist)
            return false;
        if (!userExist.isActive ||
            (userExist && !(await (0, bcryptjs_1.compare)(password, userExist.password)))) {
            return false;
        }
        return userExist;
    }
    async getInvitationLink(token) {
        const invitationLink = `${constants_util_1.default.ACCOUNT_INVITATION_BASE_LINK}?token=${token}`;
        return invitationLink;
    }
}
exports.default = new UserUtil();
//# sourceMappingURL=user.util.js.map