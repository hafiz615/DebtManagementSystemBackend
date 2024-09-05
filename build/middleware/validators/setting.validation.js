"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
const enums_1 = require("../../enums");
class SettingValidate {
    async validateNotificationConfiguration(req, res, next) {
        const schema = joi_1.default.object({
            label: joi_1.default.string().optional().allow('', null),
            value: joi_1.default.string()
                .valid(enums_1.Events.case_details_update, enums_1.Events.case_manager_changed, enums_1.Events.case_negotiator_changed, enums_1.Events.case_note_added, enums_1.Events.case_owner_changed, enums_1.Events.case_task_added, enums_1.Events.case_task_assigned, enums_1.Events.case_task_due_data_near, enums_1.Events.case_task_unassigned, enums_1.Events.failed_authorization, enums_1.Events.failed_payment, enums_1.Events.successful_authorization, enums_1.Events.case_details_update, enums_1.Events.upcoming_payment, enums_1.Events.successful_payment)
                .required(),
            userPermission: joi_1.default.array()
                .items(joi_1.default.object({
                role: joi_1.default.string()
                    .valid(enums_1.User.admin, enums_1.User.case_Manager, enums_1.User.creditor, enums_1.User.debtor, enums_1.User.negotiator)
                    .required(),
                sms_allowed: joi_1.default.boolean().required(),
                email_allowed: joi_1.default.boolean().required(),
                sms_template: joi_1.default.string().allow(''),
                email_template: joi_1.default.string().allow(''),
            }))
                .required(),
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
    async paymentsAuthorizations(req, res, next) {
        const schema = joi_1.default.object({
            paymentsAuthorizations: joi_1.default.object({
                retryInterval: joi_1.default.object({
                    failedAuthorization: joi_1.default.object({
                        unit: joi_1.default.string().valid('days', 'hours').required(),
                        value: joi_1.default.number().positive().required(),
                        maxRetry: joi_1.default.number().positive().required(),
                    }),
                    failedPayment: joi_1.default.object({
                        unit: joi_1.default.string().valid('days', 'hours').required(),
                        value: joi_1.default.number().positive().required(),
                        maxRetry: joi_1.default.number().positive().required(),
                    }),
                }),
                authorizationInterval: joi_1.default.object({
                    custom: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required(),
                        value: joi_1.default.number().positive().required(),
                    }),
                    daily: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required(),
                        value: joi_1.default.number().positive().required(),
                    }),
                    weekly: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required(),
                        value: joi_1.default.number().positive().required(),
                    }),
                    fortnightly: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required(),
                        value: joi_1.default.number().positive().required(),
                    }),
                    monthly: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required(),
                        value: joi_1.default.number().positive().required(),
                    }),
                }),
            }),
            notificationTemplates: joi_1.default.array(),
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
exports.default = new SettingValidate();
//# sourceMappingURL=setting.validation.js.map