"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
class InboxRequests {
    async createMessage(req, res, next) {
        const schema = joi_1.default.object({
            subject: joi_1.default.string().required().min(3).max(255).messages({
                'any.required': 'Subject is required.',
                'string.base': 'Subject must be a string.',
                'string.empty': 'Subject cannot be empty.',
                'string.min': 'Subject must be at least 3 characters long.',
                'string.max': 'Subject must be less than or equal to 255 characters long.',
            }),
            name: joi_1.default.string().required().min(3).max(255).messages({
                'any.required': 'Name is required.',
                'string.base': 'Name must be a string.',
                'string.empty': 'Name cannot be empty.',
                'string.min': 'Name must be at least 3 characters long.',
                'string.max': 'Name must be less than or equal to 255 characters long.',
            }),
            to: joi_1.default.string().required().messages({
                'any.required': 'To field is required.',
                'string.base': 'To field must be a string.',
                'string.empty': 'To field cannot be empty.',
            }),
            from: joi_1.default.string().required().messages({
                'any.required': 'From field is required.',
                'string.base': 'From field must be a string.',
                'string.empty': 'From field cannot be empty.',
            }),
            cC: joi_1.default.string().required().messages({
                'any.required': 'CC field is required.',
                'string.base': 'CC field must be a string.',
                'string.empty': 'CC field cannot be empty.',
            }),
            text: joi_1.default.string().required().messages({
                'any.required': 'Text content is required.',
                'string.base': 'Text content must be a string.',
                'string.empty': 'Text content cannot be empty.',
            }),
            textAsHtml: joi_1.default.string().required().messages({
                'any.required': 'HTML text content is required.',
                'string.base': 'HTML text content must be a string.',
                'string.empty': 'HTML text content cannot be empty.',
            }),
            type: joi_1.default.string().required().messages({
                'any.required': 'Type field is required.',
                'string.base': 'Type must be a string.',
                'string.empty': 'Type field cannot be empty.',
            }),
            debitorCompanyName: joi_1.default.string().required().messages({
                'any.required': 'Debtor Company Name is required.',
                'string.base': 'Debtor Company Name must be a string.',
                'string.empty': 'Debtor Company Name cannot be empty.',
            }),
            creditorCompanyName: joi_1.default.string().required().messages({
                'any.required': 'Creditor Company Name is required.',
                'string.base': 'Creditor Company Name must be a string.',
                'string.empty': 'Creditor Company Name cannot be empty.',
            }),
            caseCode: joi_1.default.string().required().messages({
                'any.required': 'Case Code is required.',
                'string.base': 'Case Code must be a string.',
                'string.empty': 'Case Code cannot be empty.',
            }),
            isRead: joi_1.default.boolean().required().messages({
                'any.required': 'Read status is required.',
                'boolean.base': 'Read status must be a boolean value.',
                'boolean.empty': 'Read status cannot be empty.',
            }),
            isDeleted: joi_1.default.boolean().required().messages({
                'any.required': 'Deleted status is required.',
                'boolean.base': 'Deleted status must be a boolean value.',
                'boolean.empty': 'Deleted status cannot be empty.',
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
    async markAsRead(req, res, next) {
        const schema = joi_1.default.object({
            id: joi_1.default.string().required().length(24).hex().messages({
                'any.required': 'Message ID is required.',
                'string.base': 'Message ID must be a string.',
                'string.empty': 'Message ID cannot be empty.',
                'string.length': 'Message ID must be exactly 24 characters long.',
                'string.hex': 'Message ID must be a valid hexadecimal string.',
            }),
        });
        const { error } = schema.validate(req.params);
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
exports.default = new InboxRequests();
//# sourceMappingURL=inbox.validate.js.map