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
            label: joi_1.default.string().optional().allow('', null).messages({
                'string.empty': 'Label cannot be empty.',
                'string.base': 'Label must be a string.',
            }),
            value: joi_1.default.string()
                .valid(enums_1.Events.case_details_update, enums_1.Events.case_manager_changed, enums_1.Events.case_negotiator_changed, enums_1.Events.case_note_added, enums_1.Events.case_owner_changed, enums_1.Events.case_task_added, enums_1.Events.case_task_assigned, enums_1.Events.case_task_due_data_near, enums_1.Events.case_task_unassigned, enums_1.Events.failed_authorization, enums_1.Events.failed_payment, enums_1.Events.successful_authorization, enums_1.Events.case_details_update, enums_1.Events.upcoming_payment, enums_1.Events.successful_payment, enums_1.Events.successful_capture, enums_1.Events.failed_capture, enums_1.Events.change_payment_amount, enums_1.Events.move_payment_to_last, enums_1.Events.pause_all_payments, enums_1.Events.pause_single_payment)
                .required()
                .messages({
                'any.required': 'Event value is required.',
                'any.only': 'Invalid event value.',
                'string.base': 'Event value must be a string.',
            }),
            userPermission: joi_1.default.array()
                .items(joi_1.default.object({
                role: joi_1.default.string()
                    .valid(enums_1.User.admin, enums_1.User.case_Manager, enums_1.User.creditor, enums_1.User.debtor, enums_1.User.negotiator)
                    .required()
                    .messages({
                    'any.required': 'Role is required.',
                    'any.only': 'Invalid role.',
                    'string.base': 'Role must be a string.',
                    'string.empty': 'Role cannot be empty.',
                }),
                sms_allowed: joi_1.default.boolean().required().messages({
                    'any.required': 'SMS permission is required.',
                    'boolean.base': 'SMS permission must be a boolean.',
                }),
                email_allowed: joi_1.default.boolean().required().messages({
                    'any.required': 'Email permission is required.',
                    'boolean.base': 'Email permission must be a boolean.',
                }),
                sms_template: joi_1.default.string().allow('').messages({
                    'string.base': 'SMS template must be a string.',
                }),
                email_template: joi_1.default.string().allow('').messages({
                    'string.base': 'Email template must be a string.',
                }),
            }))
                .required()
                .messages({
                'any.required': 'User permission details are required.',
                'array.base': 'User permission must be an array.',
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
    async paymentsAuthorizations(req, res, next) {
        const schema = joi_1.default.object({
            paymentsAuthorizations: joi_1.default.object({
                retryInterval: joi_1.default.object({
                    failedAuthorization: joi_1.default.object({
                        unit: joi_1.default.string().valid('days', 'hours').required().messages({
                            'any.required': 'Failed authorization unit is required.',
                            'any.only': 'Invalid unit for failed authorization.',
                            'string.base': 'Unit must be a string.',
                            'string.empty': 'Unit cannot be empty.',
                        }),
                        value: joi_1.default.number().positive().required().messages({
                            'any.required': 'Failed authorization value is required.',
                            'number.positive': 'Failed authorization value must be a positive number.',
                            'number.base': 'Value must be a number.',
                        }),
                        maxRetry: joi_1.default.number().positive().required().messages({
                            'any.required': 'Max retry for failed authorization is required.',
                            'number.positive': 'Max retry must be a positive number.',
                            'number.base': 'Max retry must be a number.',
                        }),
                    }),
                    failedPayment: joi_1.default.object({
                        unit: joi_1.default.string().valid('days', 'hours').required().messages({
                            'any.required': 'Failed payment unit is required.',
                            'any.only': 'Invalid unit for failed payment.',
                            'string.base': 'Unit must be a string.',
                            'string.empty': 'Unit cannot be empty.',
                        }),
                        value: joi_1.default.number().positive().required().messages({
                            'any.required': 'Failed payment value is required.',
                            'number.positive': 'Failed payment value must be a positive number.',
                            'number.base': 'Value must be a number.',
                        }),
                        maxRetry: joi_1.default.number().positive().required().messages({
                            'any.required': 'Max retry for failed payment is required.',
                            'number.positive': 'Max retry must be a positive number.',
                            'number.base': 'Max retry must be a number.',
                        }),
                    }),
                }),
                authorizationInterval: joi_1.default.object({
                    custom: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required().messages({
                            'any.required': 'Custom unit is required.',
                            'any.only': 'Invalid unit for custom authorization interval.',
                            'string.base': 'Unit must be a string.',
                            'string.empty': 'Unit cannot be empty.',
                        }),
                        value: joi_1.default.number().positive().required().messages({
                            'any.required': 'Custom value is required.',
                            'number.positive': 'Custom value must be a positive number.',
                            'number.base': 'Value must be a number.',
                        }),
                    }),
                    daily: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required().messages({
                            'any.required': 'Daily unit is required.',
                            'any.only': 'Invalid unit for daily authorization interval.',
                            'string.base': 'Unit must be a string.',
                            'string.empty': 'Unit cannot be empty.',
                        }),
                        value: joi_1.default.number().positive().required().messages({
                            'any.required': 'Daily value is required.',
                            'number.positive': 'Daily value must be a positive number.',
                            'number.base': 'Value must be a number.',
                        }),
                    }),
                    weekly: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required().messages({
                            'any.required': 'Weekly unit is required.',
                            'any.only': 'Invalid unit for weekly authorization interval.',
                            'string.base': 'Unit must be a string.',
                            'string.empty': 'Unit cannot be empty.',
                        }),
                        value: joi_1.default.number().positive().required().messages({
                            'any.required': 'Weekly value is required.',
                            'number.positive': 'Weekly value must be a positive number.',
                            'number.base': 'Value must be a number.',
                        }),
                    }),
                    fortnightly: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required().messages({
                            'any.required': 'Fortnightly unit is required.',
                            'any.only': 'Invalid unit for fortnightly authorization interval.',
                            'string.base': 'Unit must be a string.',
                            'string.empty': 'Unit cannot be empty.',
                        }),
                        value: joi_1.default.number().positive().required().messages({
                            'any.required': 'Fortnightly value is required.',
                            'number.positive': 'Fortnightly value must be a positive number.',
                            'number.base': 'Value must be a number.',
                        }),
                    }),
                    monthly: joi_1.default.object({
                        unit: joi_1.default.string().valid('hours', 'days').required().messages({
                            'any.required': 'Monthly unit is required.',
                            'any.only': 'Invalid unit for monthly authorization interval.',
                            'string.base': 'Unit must be a string.',
                            'string.empty': 'Unit cannot be empty.',
                        }),
                        value: joi_1.default.number().positive().required().messages({
                            'any.required': 'Monthly value is required.',
                            'number.positive': 'Monthly value must be a positive number.',
                            'number.base': 'Value must be a number.',
                        }),
                    }),
                }),
            }),
            notificationTemplates: joi_1.default.array().optional().messages({
                'array.base': 'Notification templates must be an array.',
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
    async validateFee(req, res, next) {
        const schema = joi_1.default.object({
            type: joi_1.default.string()
                .valid('legalFee', 'serviceFee', 'pausePaymentFee')
                .required()
                .messages({
                'any.required': 'Fee type is required.',
                'string.base': 'Fee type must be a string.',
                'string.empty': 'Fee type cannot be an empty string.',
                'any.only': 'Fee type is invalid',
            }),
            fee: joi_1.default.number().positive().required().messages({
                'any.required': 'Fee is required.',
                'number.positive': 'Fee must be a positive number.',
                'number.base': 'Fee must be a number.',
            }),
        });
        const { error } = schema.validate({ ...req.query, ...req.body });
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
exports.default = new SettingValidate();
//# sourceMappingURL=setting.validation.js.map