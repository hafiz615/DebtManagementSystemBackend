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
            dueDate: joi_1.default.date().required().messages({
                'any.required': 'Due date is required.',
                'date.base': 'Due date must be a valid date.',
            }),
            assignee: joi_1.default.string().required().messages({
                'any.required': 'Assignee is required.',
                'string.base': 'Assignee must be a string.',
            }),
            assigneeId: joi_1.default.string().required().messages({
                'any.required': 'Assignee ID is required.',
                'string.base': 'Assignee ID must be a string.',
            }),
            title: joi_1.default.string().required().messages({
                'any.required': 'Title is required.',
                'string.base': 'Title must be a string.',
            }),
            notes: joi_1.default.string().messages({
                'string.base': 'Notes must be a string.',
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
    async updateTask(req, res, next) {
        const schema = joi_1.default.object({
            dueDate: joi_1.default.date().required().messages({
                'any.required': 'Due date is required.',
                'date.base': 'Due date must be a valid date.',
            }),
            assignee: joi_1.default.string().required().messages({
                'any.required': 'Assignee is required.',
                'string.base': 'Assignee must be a string.',
            }),
            assigneeId: joi_1.default.string().required().messages({
                'any.required': 'Assignee ID is required.',
                'string.base': 'Assignee ID must be a string.',
            }),
            status: joi_1.default.string()
                .valid('To do', 'On hold', 'Blocked', 'Completed')
                .required()
                .messages({
                'any.required': 'Status is required.',
                'any.only': 'Status must be one of: To do, On hold, Blocked, or Completed.',
                'string.base': 'Status must be a string.',
            }),
            notes: joi_1.default.string().messages({
                'string.base': 'Notes must be a string.',
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
//# sourceMappingURL=task.validate.js.map