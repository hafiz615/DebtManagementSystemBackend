"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const dotenv_1 = __importDefault(require("dotenv"));
const user_repository_1 = require("../repository/user/user.repository");
dotenv_1.default.config();
class TokenService {
    constructor() {
        this.create = async (userId, uuid, expiresIn) => {
            try {
                const accessToken = this.generateJwtToken({
                    userId: userId,
                    sessionId: uuid,
                }, process.env.jwtKey, expiresIn);
                return accessToken;
            }
            catch (err) {
                throw new Error('Something went wrong while creating token' + err);
            }
        };
        this.createVerifyToken = async (email, key, expiresIn) => {
            try {
                const accessToken = this.generateJwtToken({
                    email: email,
                }, key, expiresIn);
                return accessToken;
            }
            catch (err) {
                throw new Error('Something went wrong while creating token' + err);
            }
        };
        this.userRepository = new user_repository_1.UserRepository();
    }
    generateJwtToken(payload, jwtKey, expiresIn) {
        const token = (0, jsonwebtoken_1.sign)(payload, jwtKey, {
            expiresIn: expiresIn,
        });
        return token;
    }
    async validateToken(token, userId, sessionId) {
        const user = await this.userRepository.getOne({
            _id: userId,
            sessionIds: { $in: [sessionId] },
        });
        return user ? user : null;
    }
}
exports.default = TokenService;
//# sourceMappingURL=token.service.js.map