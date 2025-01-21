"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class StatusValidate {
    async addStatus(req, res, next) {
        const schema = joi_1.default.object({
            status: joi_1.default.string().required().messages({
                'any.required': 'Status is required.',
                'string.base': 'Status must be a string.',
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
    async updateStatus(req, res, next) {
        const schema = joi_1.default.object({
            original: joi_1.default.string().required().messages({
                'any.required': 'Original status is required.',
                'string.base': 'Original status must be a string.',
            }),
            update: joi_1.default.string().required().messages({
                'any.required': 'Updated status is required.',
                'string.base': 'Updated status must be a string.',
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
    async updateStatusArray(req, res, next) {
        const schema = joi_1.default.object({
            status: joi_1.default.array().items(joi_1.default.string()).required().messages({
                'any.required': 'Status array is required.',
                'array.base': 'Status must be an array.',
                'string.base': 'Each status must be a string.',
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
    async deleteStatus(req, res, next) {
        const schema = joi_1.default.object({
            original: joi_1.default.string().required().messages({
                'any.required': 'Original status is required.',
                'string.base': 'Original status must be a string.',
            }),
            update: joi_1.default.string().required().messages({
                'any.required': 'Updated status is required.',
                'string.base': 'Updated status must be a string.',
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
exports.default = new StatusValidate();
//# sourceMappingURL=status.validate.js.map