"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const user_model_1 = require("../../../database/models/user.model");
const global_1 = __importDefault(require("../../../global"));
const base_repository_1 = require("../base.repository");
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(user_model_1.User);
    }
    async updateUserByIdOrEmail(email, user) {
        return await user_model_1.User.findOneAndUpdate({
            $or: [{ _id: global_1.default.userId }, { email: email }],
        }, user, { new: true });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map