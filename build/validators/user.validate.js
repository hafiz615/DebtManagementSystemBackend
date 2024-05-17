"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class UserRequests {
    async createUser(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required(),
            email: joi_1.default.string().email().required(),
            role: joi_1.default.string().valid('Negotiator', 'Manager').required(),
            isActive: joi_1.default.string(),
            createdBy: joi_1.default.string().required(),
            SSID: joi_1.default.string()
                .pattern(/^[a-zA-Z0-9]+$/)
                .required(),
            dateOfBirth: joi_1.default.date().required(),
            phone: joi_1.default.string()
                .pattern(/^\d{10,11}$/)
                .required(),
            gender: joi_1.default.string().valid('Male', 'Female', 'Other').required(),
            address: joi_1.default.string().required(),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async signIn(req, res, next) {
        const schema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string().regex(constants_util_1.default.passwordRegex, constants_util_1.default.Messages.PASSWORD_FORMAT),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
}
exports.default = new UserRequests();
//# sourceMappingURL=user.validate.js.map