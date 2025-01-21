"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class CustomFieldRequest {
    async addCustomField(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required().messages({
                'string.base': 'The name must be a string.',
                'string.empty': 'The name field cannot be empty.',
                'any.required': 'The name field is required.',
            }),
            type: joi_1.default.string().valid('date', 'number', 'text').required().messages({
                'string.base': 'The type must be a string.',
                'string.empty': 'The type field cannot be empty.',
                'any.required': 'The type field is required.',
                'any.only': 'The type must be one of: date, number, or text.',
            }),
            description: joi_1.default.string().optional().messages({
                'string.base': 'The description must be a string.',
                'string.empty': 'The description field cannot be empty.',
            }),
            target: joi_1.default.string().valid('case').required().messages({
                'string.base': 'The target must be a string.',
                'string.empty': 'The target field cannot be empty.',
                'any.required': 'The target field is required.',
                'any.only': 'The target must be "case".',
            }),
            shared: joi_1.default.boolean().optional().messages({
                'boolean.base': 'The shared field must be a boolean.',
            }),
        });
        const { error } = schema.validate(req.body, { abortEarly: false });
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
exports.default = new CustomFieldRequest();
//# sourceMappingURL=customField.validate.js.map