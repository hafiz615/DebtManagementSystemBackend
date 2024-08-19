"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = require("bcryptjs");
const user_repository_1 = require("../api/repository/user/user.repository");
const common_util_1 = __importDefault(require("./common.util"));
const setEnv_1 = require("../database/repomodels/setEnv");
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
        const invitationLink = `${setEnv_1.EnvSetup.invitationLink}?token=${token}`;
        return invitationLink;
    }
    async getAllUserFilters(req) {
        const filters = { role: { $nin: ['Admin', 'Super User'] }, isDeleted: false };
        if (req.query.search === 'true') {
            const text = req.body.text;
            if (text) {
                filters['$or'] = [
                    { name: { $regex: text, $options: 'i' } },
                    { email: { $regex: text, $options: 'i' } },
                    { role: { $regex: text, $options: 'i' } },
                    { SSID: { $regex: text, $options: 'i' } },
                    { phone: { $regex: text, $options: 'i' } },
                    { gender: { $regex: text, $options: 'i' } },
                    { address: { $regex: text, $options: 'i' } },
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
        }
        return filters;
    }
}
exports.default = new UserUtil();
//# sourceMappingURL=user.util.js.map