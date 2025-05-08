"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class PaymentValidate {
    async addACHDetails(req, res, next) {
        const schema = joi_1.default.object({
            data: joi_1.default.string().required().messages({
                'string.base': 'Data must be a string.',
                'string.empty': 'Data cannot be empty.',
                'any.required': 'Data is a required field.',
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
    async addAccount(req, res, next) {
        const schema = joi_1.default.object({
            platform: joi_1.default.string()
                .valid('Seamlesschex', 'Paynote')
                .required()
                .messages({
                'string.base': 'Platform must be a string.',
                'string.empty': 'Platform cannot be empty.',
                'any.only': 'Platform must be one of Seamlesschex or Paynote.',
                'any.required': 'Platform is a required field.',
            }),
            data: joi_1.default.string().required().messages({
                'string.base': 'Data must be a string.',
                'string.empty': 'Data cannot be empty.',
                'any.required': 'Data is a required field.',
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
    async updateACHDetails(req, res, next) {
        const schema = joi_1.default.object({
            data: joi_1.default.string().required().messages({
                'string.base': 'Data must be a string.',
                'string.empty': 'Data cannot be empty.',
                'any.required': 'Data is a required field.',
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
    async updatePaymentLinkStatus(req, res, next) {
        const schema = joi_1.default.object({
            status: joi_1.default.string().valid('Success', 'Failed').required().messages({
                'string.base': 'Status must be a string.',
                'string.empty': 'Status cannot be empty.',
                'any.only': 'Status must be one of Success or Failed.',
                'any.required': 'Status is a required field.',
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
    async updatePaymentInvoiceStatus(req, res, next) {
        const schema = joi_1.default.object({
            status: joi_1.default.string().valid('Success', 'Failed').required().messages({
                'string.base': 'Status must be a string.',
                'string.empty': 'Status cannot be empty.',
                'any.only': 'Status must be one of Success or Failed.',
                'any.required': 'Status is a required field.',
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
    async updatePaymentDate(req, res, next) {
        const schema = joi_1.default.object({
            date: joi_1.default.date().required().messages({
                'date.base': 'Date must be a valid date.',
                'any.required': 'Date is required.',
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
exports.default = new PaymentValidate();
//# sourceMappingURL=payment.validate.js.map