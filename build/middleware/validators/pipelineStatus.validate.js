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
            pipeline: joi_1.default.string().required().messages({
                'string.base': 'Pipeline must be a string.',
                'string.empty': 'Pipeline cannot be empty.',
                'any.required': 'Pipeline is a required field.',
            }),
            status: joi_1.default.array()
                .items(joi_1.default.object({
                name: joi_1.default.string().required().messages({
                    'string.base': 'Status name must be a string.',
                    'string.empty': 'Status name cannot be empty.',
                    'any.required': 'Status name is a required field.',
                }),
                type: joi_1.default.string()
                    .valid('Active', 'Won', 'Lost')
                    .required()
                    .messages({
                    'string.base': 'Status type must be a string.',
                    'string.empty': 'Status type cannot be empty.',
                    'any.only': 'Status type must be one of Active, Won, or Lost.',
                    'any.required': 'Status type is a required field.',
                }),
            }).optional())
                .messages({
                'array.base': 'Status must be an array of objects.',
            }),
            description: joi_1.default.string().allow('').messages({
                'string.base': 'Description must be a string.',
            }),
            userId: joi_1.default.string().allow('').optional().messages({
                'string.base': 'User ID must be a string.',
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
    async addStatusPipeline(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required().messages({
                'string.base': 'Name must be a string.',
                'string.empty': 'Name cannot be empty.',
                'any.required': 'Name is a required field.',
            }),
            type: joi_1.default.string().valid('Active', 'Won', 'Lost').required().messages({
                'string.base': 'Type must be a string.',
                'string.empty': 'Type cannot be empty.',
                'any.only': 'Type must be one of Active, Won, or Lost.',
                'any.required': 'Type is a required field.',
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
    async updateStatusPipeline(req, res, next) {
        const schema = joi_1.default.object({
            original: joi_1.default.object({
                name: joi_1.default.string().required().messages({
                    'string.base': 'Original name must be a string.',
                    'string.empty': 'Original name cannot be empty.',
                    'any.required': 'Original name is a required field.',
                }),
                type: joi_1.default.string().valid('Active', 'Won', 'Lost').required().messages({
                    'string.base': 'Original type must be a string.',
                    'string.empty': 'Original type cannot be empty.',
                    'any.only': 'Original type must be one of Active, Won, or Lost.',
                    'any.required': 'Original type is a required field.',
                }),
            })
                .required()
                .messages({
                'any.required': 'Original object is required.',
                'object.base': 'Original must be an object.',
            }),
            update: joi_1.default.object({
                name: joi_1.default.string().required().messages({
                    'string.base': 'Updated name must be a string.',
                    'string.empty': 'Updated name cannot be empty.',
                    'any.required': 'Updated name is a required field.',
                }),
                type: joi_1.default.string()
                    .valid('Active', 'Won', 'Lost')
                    .required()
                    .messages({
                    'string.base': 'Updated type must be a string.',
                    'string.empty': 'Updated type cannot be empty.',
                    'any.only': 'Updated type must be one of Active, Won, or Lost.',
                    'any.required': 'Updated type is a required field.',
                }),
            })
                .required()
                .messages({
                'any.required': 'Update object is required.',
                'object.base': 'Update must be an object.',
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
    async deleteStatusPipeline(req, res, next) {
        const schema = joi_1.default.object({
            original: joi_1.default.object({
                name: joi_1.default.string().required().messages({
                    'string.base': 'Original name must be a string.',
                    'string.empty': 'Original name cannot be empty.',
                    'any.required': 'Original name is a required field.',
                }),
                type: joi_1.default.string()
                    .valid('Active', 'Won', 'Lost')
                    .required()
                    .messages({
                    'string.base': 'Original type must be a string.',
                    'string.empty': 'Original type cannot be empty.',
                    'any.only': 'Original type must be one of Active, Won, or Lost.',
                    'any.required': 'Original type is a required field.',
                }),
            })
                .required()
                .messages({
                'any.required': 'Original object is required.',
                'object.base': 'Original must be an object.',
            }),
            update: joi_1.default.object({
                name: joi_1.default.string().messages({
                    'string.base': 'Updated name must be a string.',
                    'string.empty': 'Updated name cannot be empty.',
                }),
                type: joi_1.default.string().valid('Active', 'Won', 'Lost').messages({
                    'string.base': 'Updated type must be a string.',
                    'string.empty': 'Updated type cannot be empty.',
                    'any.only': 'Updated type must be one of Active, Won, or Lost.',
                }),
            }).messages({
                'object.base': 'Update must be an object.',
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
exports.default = new PipelineStatusValidate();
//# sourceMappingURL=pipelineStatus.validate.js.map