"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class StatusValidate {
    async addTask(req, res, next) {
        const schema = joi_1.default.object({
            dueDate: joi_1.default.date().required(),
            assignee: joi_1.default.string().required(),
            assigneeId: joi_1.default.string().required(),
            title: joi_1.default.string().required(),
            notes: joi_1.default.string(),
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
    async updateTask(req, res, next) {
        const schema = joi_1.default.object({
            dueDate: joi_1.default.date().required(),
            assignee: joi_1.default.string().required(),
            assigneeId: joi_1.default.string().required(),
            status: joi_1.default.string()
                .valid('To do', 'On hold', 'Blocked', 'Completed')
                .required(),
            notes: joi_1.default.string(),
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
exports.default = new StatusValidate();
//# sourceMappingURL=task.validate.js.map