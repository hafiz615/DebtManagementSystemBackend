"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class SeemlesschexValidate {
    async createCheck(req, res, next) {
        const schema = joi_1.default.object({
            transactionIds: joi_1.default.array().items(joi_1.default.string()).required().messages({
                'any.required': 'Transaction IDs are required.',
                'array.base': 'Transaction IDs must be an array.',
            }),
            amount: joi_1.default.number().required().messages({
                'any.required': 'Amount is required.',
                'number.base': 'Amount must be a number.',
            }),
            commission: joi_1.default.number().required().messages({
                'any.required': 'Commission is required.',
                'number.base': 'Commission must be a number.',
            }),
            transactionDate: joi_1.default.date().required().messages({
                'any.required': 'Transaction date is required.',
                'date.base': 'Transaction date must be a valid date.',
            }),
            transactionType: joi_1.default.string()
                .valid('Wire', 'Check', 'Cash')
                .required()
                .messages({
                'any.required': 'Transaction type is required.',
                'any.only': 'Transaction type must be one of [Wire, Check, Cash].',
            }),
            referenceId: joi_1.default.string().allow('').messages({
                'string.base': 'Reference ID must be a string.',
            }),
            data: joi_1.default.string().required().messages({
                'any.required': 'Data is required.',
                'string.base': 'Data must be a string.',
            }),
            debtorId: joi_1.default.string().required().messages({
                'any.required': 'Debtor ID is required.',
                'string.base': 'Debtor ID must be a string.',
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
    async createPaymentLink(req, res, next) {
        const schema = joi_1.default.object({
            amount: joi_1.default.number().strict().required().messages({
                'any.required': 'Amount is required.',
                'number.base': 'Amount must be a number.',
            }),
            debtorId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/) // Matches a valid MongoDB ObjectId
                .required()
                .messages({
                'any.required': 'Debtor ID is required.',
                'string.pattern.base': 'Debtor ID is invalid.',
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
    async updateCheck(req, res, next) {
        const schema = joi_1.default.object({
            data: joi_1.default.string().required().messages({
                'any.required': 'Data is required.',
                'string.base': 'Data must be a string.',
            }),
            checkId: joi_1.default.string().required().messages({
                'any.required': 'Check ID is required.',
                'string.base': 'Check ID must be a string.',
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
    async voidCheck(req, res, next) {
        const schema = joi_1.default.object({
            checkId: joi_1.default.string().required().messages({
                'any.required': 'Check ID is required.',
                'string.base': 'Check ID must be a string.',
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
exports.default = new SeemlesschexValidate();
//# sourceMappingURL=seemlesschex.validate.js.map