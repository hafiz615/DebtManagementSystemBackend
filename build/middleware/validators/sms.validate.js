"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
const mongoose_1 = __importDefault(require("mongoose"));
class SmsValidate {
    async saveCaseDetailNotification(req, res, next) {
        const schema = joi_1.default.object({
            caseId: joi_1.default.string()
                .custom((value, helpers) => {
                if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
                .required()
                .messages({
                'string.empty': 'caseId cannot be empty.',
                'any.required': 'caseId is required.',
                'string.base': 'caseId must be a string.',
                'any.invalid': 'caseId must be a valid MongoDB ObjectId.',
            }),
            notificationId: joi_1.default.string()
                .custom((value, helpers) => {
                if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
                .required()
                .messages({
                'string.empty': 'notificationId cannot be empty.',
                'any.required': 'notificationId is required.',
                'string.base': 'notificationId must be a string.',
                'any.invalid': 'notificationId must be a valid MongoDB ObjectId.',
            }),
            inboxId: joi_1.default.string()
                .custom((value, helpers) => {
                if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
                .required()
                .messages({
                'string.empty': 'inboxId cannot be empty.',
                'any.required': 'inboxId is required.',
                'string.base': 'inboxId must be a string.',
                'any.invalid': 'inboxId must be a valid MongoDB ObjectId.',
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