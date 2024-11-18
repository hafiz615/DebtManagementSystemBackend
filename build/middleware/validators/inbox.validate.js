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
            subject: joi_1.default.string().required().min(3).max(255),
            name: joi_1.default.string().required().min(3).max(255),
            to: joi_1.default.string().required(),
            from: joi_1.default.string().required(),
            cC: joi_1.default.string().required(),
            text: joi_1.default.string().required(),
            textAsHtml: joi_1.default.string().required(),
            type: joi_1.default.string().required(),
            debitorCompanyName: joi_1.default.string().required(),
            creditorCompanyName: joi_1.default.string().required(),
            caseCode: joi_1.default.string().required(),
            isRead: joi_1.default.boolean().required(),
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
    async markAsRead(req, res, next) {
        const schema = joi_1.default.object({
            id: joi_1.default.string().required().length(24).hex(),
        });
        const { error } = schema.validate(req.params);
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
exports.default = new InboxRequests();
//# sourceMappingURL=inbox.validate.js.map