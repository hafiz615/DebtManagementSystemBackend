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
            transactionIds: joi_1.default.array().items(joi_1.default.string()).required(),
            amount: joi_1.default.number().required(),
            commission: joi_1.default.number().required(),
            transactionDate: joi_1.default.date().required(),
            transactionType: joi_1.default.string().valid('Wire', 'Check', 'Cash').required(),
            referenceId: joi_1.default.string().allow(''),
            data: joi_1.default.string().required(),
            debtorId: joi_1.default.string().required(),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
        }
    }
    async createPaymentLink(req, res, next) {
        const schema = joi_1.default.object({
            amount: joi_1.default.number().strict().required(),
            debtorId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/) // Matches a valid MongoDB ObjectId
                .required()
                .messages({
                'string.pattern.base': 'Debtor id is invalid',
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
            data: joi_1.default.string().required(),
            checkId: joi_1.default.string().required(),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
        }
    }
    async voidCheck(req, res, next) {
        const schema = joi_1.default.object({
            transactionIds: joi_1.default.array().items(joi_1.default.string()).required(),
            checkId: joi_1.default.string().required(),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
        }
    }
}
exports.default = new SeemlesschexValidate();
//# sourceMappingURL=seemlesschex.validate.js.map