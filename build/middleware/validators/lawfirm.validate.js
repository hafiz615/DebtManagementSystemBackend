"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
class LawfirmValidate {
    async updateLawfirm(req, res, next) {
        const schema = joi_1.default.object({
            lawfirmCompanyName: joi_1.default.string().messages({
                'string.base': 'Lawfirm company name must be a string.',
                'any.required': 'Lawfirm company name is a required field.',
                'string.empty': 'Lawfirm company cannot be empty',
            }),
            email: joi_1.default.string().email().messages({
                'string.base': 'Lawfirm Email must be a string.',
                'string.email': 'Lawfirm Email must be a valid email address.',
                'any.required': 'Lawfirm Email is a required field.',
                'string.empty': 'Lawfirm Email cannot be empty',
            }),
            phone: joi_1.default.string()
                .pattern(/^\d{10}$/)
                .required()
                .messages({
                'string.base': 'lawfirm PhoneNo must be a string.',
                'string.pattern.base': 'lawfirm PhoneNo must be 10 digits.',
                'any.required': 'lawfirm PhoneNo is a required field.',
            }),
            address: joi_1.default.string().messages({
                'string.base': 'lawfirm Address must be a string.',
                'any.required': 'lawfirm Address is a required field.',
            }),
            city: joi_1.default.string().messages({
                'string.base': 'lawfirm City must be a string.',
                'any.required': 'lawfirm City is a required field.',
            }),
            state: joi_1.default.string().messages({
                'string.base': 'lawfirm State must be a string.',
                'any.required': 'lawfirm State is a required field.',
            }),
            EIN: joi_1.default.string().pattern(/^\d+$/).messages({
                'string.base': 'lawfirm EIN must be a string.',
                'string.pattern.base': 'lawfirm EIN must contain only digits.',
                'any.required': 'lawfirm EIN is a required field.',
            }),
            monthly_subscription_fee: joi_1.default.number().allow('').messages({
                'number.base': 'lawfirm fee must be a number.',
                'any.required': 'lawfirm fee is a required field.',
                'string.empty': 'lawfirm fee cannot be empty',
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
    async assignLawfirmToCase(req, res, next) {
        const schema = joi_1.default.object({
            lawfirmId: joi_1.default.string().required().length(24).hex().messages({
                'string.base': 'Lawfirm Id must be a string.',
                'any.required': 'Lawfirm Id is a required field.',
                'string.empty': 'Lawfirm Id cannot be empty',
                'string.length': 'Lawfirm Id must be exactly 24 characters long.',
                'string.hex': 'Lawfirm Id must be a valid hexadecimal string.',
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
    async updateLawsuit(req, res, next) {
        const schema = joi_1.default.object({
            balance: joi_1.default.number().strict().required().messages({
                'number.base': 'Balance must be a number',
                'any.required': 'Balance is required',
            }),
            lawsuitDate: joi_1.default.date().required().messages({
                'date.base': 'Lawsuit date must be a valid date.',
                'any.required': 'Lawsuit date is a required field.',
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
    async addAttorney(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string()
                .allow('')
                .messages({ 'string.base': 'Name must be a string.' }),
            email: joi_1.default.string().email().allow('').messages({
                'string.base': 'Email must be a string.',
                'string.email': 'Email must be a valid email address.',
            }),
            phone: joi_1.default.string()
                .allow('')
                .pattern(/^\d{10}$/)
                .messages({
                'string.base': 'Phone must be a string.',
                'string.pattern.base': 'Phone must be 10 digits.',
            }),
            address: joi_1.default.string()
                .allow('')
                .messages({ 'string.base': 'Address must be a string.' }),
            city: joi_1.default.string()
                .allow('')
                .messages({ 'string.base': 'City must be a string.' }),
            SSN: joi_1.default.string()
                .pattern(/^\d{9}$/)
                .allow('')
                .messages({
                'string.pattern.base': 'SSN must be a 9-digit number.',
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
exports.default = new LawfirmValidate();
//# sourceMappingURL=lawfirm.validate.js.map