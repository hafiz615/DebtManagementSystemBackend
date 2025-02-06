"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class SmsValidate {
    async saveCaseDetailNotification(req, res, next) {
        const schema = joi_1.default.object({
            caseId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/) // Matches a valId MongoDB ObjectId
                .required()
                .messages({
                'any.required': 'Case Id is required.',
                'string.pattern.base': 'Case Id is invalid.',
                'string.empty': 'Case Id cannot be empty.',
            }),
            notificationId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/) // Matches a valId MongoDB ObjectId
                .required()
                .messages({
                'any.required': 'Notification Id is required.',
                'string.pattern.base': 'Notification Id is invalid.',
                'string.empty': 'Notification Id cannot be empty.',
            }),
            inboxId: joi_1.default.string()
                .regex(/^[0-9a-fA-F]{24}$/) // Matches a valId MongoDB ObjectId
                .required()
                .messages({
                'any.required': 'Inbox Id is required.',
                'string.pattern.base': 'Inbox Id is invalid.',
                'string.empty': 'Inbox Id cannot be empty.',
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
exports.default = new SmsValidate();
//# sourceMappingURL=sms.validate.js.map