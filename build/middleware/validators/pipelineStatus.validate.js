"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class PipelineStatusValidate {
    async addPipeline(req, res, next) {
        const schema = joi_1.default.object({
            pipeline: joi_1.default.string().required(),
            status: joi_1.default.array().items(joi_1.default.object({
                name: joi_1.default.string().required(),
                type: joi_1.default.string().valid('Active', 'Won', 'Lost').required(),
            }).optional()),
            description: joi_1.default.string().allow(''),
            userId: joi_1.default.string().allow('').optional(),
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
    async updateStatusPipeline(req, res, next) {
        const schema = joi_1.default.object({
            original: joi_1.default.object({
                name: joi_1.default.string().required(),
                type: joi_1.default.string().valid('Active', 'Won', 'Lost').required(),
            }).required(),
            update: joi_1.default.object({
                name: joi_1.default.string().required(),
                type: joi_1.default.string().valid('Active', 'Won', 'Lost').required(),
            }).required(),
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
    async deleteStatusPipeline(req, res, next) {
        const schema = joi_1.default.object({
            original: joi_1.default.object({
                name: joi_1.default.string().required(),
                type: joi_1.default.string().valid('Active', 'Won', 'Lost').required(),
            }).required(),
            update: joi_1.default.object({
                name: joi_1.default.string(),
                type: joi_1.default.string().valid('Active', 'Won', 'Lost'),
            }),
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
exports.default = new PipelineStatusValidate();
//# sourceMappingURL=pipelineStatus.validate.js.map