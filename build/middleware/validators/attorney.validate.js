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
class AttorneyValidate {
    async validateCaseId(req, res, next) {
        const schema = joi_1.default.object({
            caseId: joi_1.default.string().required().messages({
                'any.required': 'Case ID is required.',
                'string.empty': 'Case ID cannot be empty.',
                'string.base': 'Case ID must be a string.',
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
    async updateAttorney(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string().allow('').messages({
                'string.base': 'Name must be a string.',
            }),
            SSN: joi_1.default.string()
                .pattern(/^\d{9}$/)
                .allow('')
                .messages({
                'string.pattern.base': 'SSN must be a 9-digit number.',
                'string.base': 'SSN must be a string.',
            }),
            city: joi_1.default.string().allow('').messages({
                'string.base': 'City must be a string.',
            }),
            email: joi_1.default.string().email().allow('').messages({
                'string.email': 'Invalid email format.',
                'string.base': 'Email must be a string.',
            }),
            phone: joi_1.default.string()
                .pattern(/^\d{10}$/)
                .allow('')
                .messages({
                'string.base': 'Phone number must be a string.',
                'string.pattern.base': 'Phone number must be exactly 10 digits.',
            }),
            address: joi_1.default.string().allow('').messages({
                'string.base': 'Address must be a string.',
            }),
            attorneyFee: joi_1.default.number().optional().messages({
                'number.base': 'Attorney fee must be a number.',
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
exports.default = new AttorneyValidate();
//# sourceMappingURL=attorney.validate.js.map