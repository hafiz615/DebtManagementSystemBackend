"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class UserRequests {
    async createUser(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required().messages({
                'string.empty': 'Name cannot be empty.',
                'any.required': 'Name is required.',
                'string.base': 'Name must be a string.',
            }),
            email: joi_1.default.string().email().required().messages({
                'string.empty': 'Email cannot be empty.',
                'any.required': 'Email is required.',
                'string.email': 'Email must be a valid email address.',
                'string.base': 'Email must be a string.',
            }),
            role: joi_1.default.string().required().messages({
                'string.empty': 'Role cannot be empty.',
                'any.required': 'Role is required.',
                'string.base': 'Role must be a string.',
            }),
            isActive: joi_1.default.string().messages({
                'string.empty': 'isActive cannot be empty.',
                'string.base': 'isActive must be a string.',
            }),
            createdBy: joi_1.default.string().messages({
                'string.empty': 'CreatedBy cannot be empty.',
                'string.base': 'CreatedBy must be a string.',
            }),
            SSID: joi_1.default.string()
                .pattern(/^\d{9}$/)
                .required()
                .messages({
                'string.empty': 'SSID cannot be empty.',
                'any.required': 'SSID is required.',
                'string.pattern.base': 'SSID must be a 9-digit number.',
                'string.base': 'SSID must be a string.',
            }),
            dateOfBirth: joi_1.default.date().required().messages({
                'any.required': 'Date of birth is required.',
                'date.base': 'Date of birth must be a valid date.',
            }),
            phone: joi_1.default.string()
                .pattern(/^\d{10}$/)
                .required()
                .messages({
                'string.empty': 'Phone number cannot be empty.',
                'any.required': 'Phone number is required.',
                'string.pattern.base': 'Phone number must be a 10-digit number.',
                'string.base': 'Phone number must be a string.',
            }),
            gender: joi_1.default.string()
                .valid('Male', 'Female', 'Other')
                .required()
                .messages({
                'string.empty': 'Gender cannot be empty.',
                'any.required': 'Gender is required.',
                'any.only': 'Gender must be one of Male, Female, or Other.',
                'string.base': 'Gender must be a string.',
            }),
            address: joi_1.default.string().required().messages({
                'string.empty': 'Address cannot be empty.',
                'any.required': 'Address is required.',
                'string.base': 'Address must be a string.',
            }),
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
            email: joi_1.default.string().email().required().messages({
                'string.empty': 'Email cannot be empty.',
                'any.required': 'Email is required.',
                'string.email': 'Email must be a valid email address.',
                'string.base': 'Email must be a string.',
            }),
            password: joi_1.default.string()
                .regex(constants_util_1.default.passwordRegex)
                .required()
                .messages({
                'string.empty': 'Password cannot be empty.',
                'any.required': 'Password is required.',
                'string.pattern.base': constants_util_1.default.Messages.PASSWORD_FORMAT,
                'string.base': 'Password must be a string.',
            }),
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
    async addSenderIdentity(req, res, next) {
        const schema = joi_1.default.object({
            from_email: joi_1.default.string().email().required().messages({
                'string.empty': 'From email cannot be empty.',
                'any.required': 'From email is required.',
                'string.email': 'From email must be a valid email address.',
                'string.base': 'From email must be a string.',
            }),
            from_name: joi_1.default.string().required().messages({
                'string.empty': 'From name cannot be empty.',
                'any.required': 'From name is required.',
                'string.base': 'From name must be a string.',
            }),
            address: joi_1.default.string().required().messages({
                'string.empty': 'Address cannot be empty.',
                'any.required': 'Address is required.',
                'string.base': 'Address must be a string.',
            }),
            city: joi_1.default.string().required().messages({
                'string.empty': 'City cannot be empty.',
                'any.required': 'City is required.',
                'string.base': 'City must be a string.',
            }),
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
    async verifySenderIdentity(req, res, next) {
        const schema = joi_1.default.object({
            url: joi_1.default.string().required().messages({
                'string.empty': 'URL cannot be empty.',
                'any.required': 'URL is required.',
                'string.base': 'URL must be a string.',
            }),
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
    async thirdPartySignIn(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required().messages({
                'string.empty': 'Name cannot be empty.',
                'any.required': 'Name is required.',
                'string.base': 'Name must be a string.',
            }),
            email: joi_1.default.string().email().required().messages({
                'string.empty': 'Email cannot be empty.',
                'any.required': 'Email is required.',
                'string.email': 'Email must be a valid email address.',
                'string.base': 'Email must be a string.',
            }),
            platform: joi_1.default.string().messages({
                'string.empty': 'Platform cannot be empty.',
                'string.base': 'Platform must be a string.',
            }),
            phone: joi_1.default.string().allow('').messages({
                'string.base': 'Phone must be a string.',
            }),
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