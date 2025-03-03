import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
import {Events, User} from '../../enums';

class SettingValidate {
  async validateNotificationConfiguration(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const schema = Joi.object({
      label: Joi.string().optional().allow('', null).messages({
        'string.empty': 'Label cannot be empty.',
        'string.base': 'Label must be a string.',
      }),
      value: Joi.string()
        .valid(
          Events.case_details_update,
          Events.case_manager_changed,
          Events.case_negotiator_changed,
          Events.case_note_added,
          Events.case_owner_changed,
          Events.case_task_added,
          Events.case_task_assigned,
          Events.case_task_due_data_near,
          Events.case_task_unassigned,
          Events.failed_authorization,
          Events.failed_payment,
          Events.successful_authorization,
          Events.case_details_update,
          Events.upcoming_payment,
          Events.successful_payment
        )
        .required()
        .messages({
          'any.required': 'Event value is required.',
          'any.only': 'Invalid event value.',
          'string.base': 'Event value must be a string.',
        }),
      userPermission: Joi.array()
        .items(
          Joi.object({
            role: Joi.string()
              .valid(
                User.admin,
                User.case_Manager,
                User.creditor,
                User.debtor,
                User.negotiator
              )
              .required()
              .messages({
                'any.required': 'Role is required.',
                'any.only': 'Invalid role.',
                'string.base': 'Role must be a string.',
                'string.empty': 'Role cannot be empty.',
              }),
            sms_allowed: Joi.boolean().required().messages({
              'any.required': 'SMS permission is required.',
              'boolean.base': 'SMS permission must be a boolean.',
            }),
            email_allowed: Joi.boolean().required().messages({
              'any.required': 'Email permission is required.',
              'boolean.base': 'Email permission must be a boolean.',
            }),
            sms_template: Joi.string().allow('').messages({
              'string.base': 'SMS template must be a string.',
            }),
            email_template: Joi.string().allow('').messages({
              'string.base': 'Email template must be a string.',
            }),
          })
        )
        .required()
        .messages({
          'any.required': 'User permission details are required.',
          'array.base': 'User permission must be an array.',
        }),
    });

    const {error} = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }

  async paymentsAuthorizations(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const schema = Joi.object({
      paymentsAuthorizations: Joi.object({
        retryInterval: Joi.object({
          failedAuthorization: Joi.object({
            unit: Joi.string().valid('days', 'hours').required().messages({
              'any.required': 'Failed authorization unit is required.',
              'any.only': 'Invalid unit for failed authorization.',
              'string.base': 'Unit must be a string.',
              'string.empty': 'Unit cannot be empty.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Failed authorization value is required.',
              'number.positive':
                'Failed authorization value must be a positive number.',
              'number.base': 'Value must be a number.',
            }),
            maxRetry: Joi.number().positive().required().messages({
              'any.required': 'Max retry for failed authorization is required.',
              'number.positive': 'Max retry must be a positive number.',
              'number.base': 'Max retry must be a number.',
            }),
          }),
          failedPayment: Joi.object({
            unit: Joi.string().valid('days', 'hours').required().messages({
              'any.required': 'Failed payment unit is required.',
              'any.only': 'Invalid unit for failed payment.',
              'string.base': 'Unit must be a string.',
              'string.empty': 'Unit cannot be empty.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Failed payment value is required.',
              'number.positive':
                'Failed payment value must be a positive number.',
              'number.base': 'Value must be a number.',
            }),
            maxRetry: Joi.number().positive().required().messages({
              'any.required': 'Max retry for failed payment is required.',
              'number.positive': 'Max retry must be a positive number.',
              'number.base': 'Max retry must be a number.',
            }),
          }),
        }),
        authorizationInterval: Joi.object({
          custom: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Custom unit is required.',
              'any.only': 'Invalid unit for custom authorization interval.',
              'string.base': 'Unit must be a string.',
              'string.empty': 'Unit cannot be empty.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Custom value is required.',
              'number.positive': 'Custom value must be a positive number.',
              'number.base': 'Value must be a number.',
            }),
          }),
          daily: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Daily unit is required.',
              'any.only': 'Invalid unit for daily authorization interval.',
              'string.base': 'Unit must be a string.',
              'string.empty': 'Unit cannot be empty.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Daily value is required.',
              'number.positive': 'Daily value must be a positive number.',
              'number.base': 'Value must be a number.',
            }),
          }),
          weekly: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Weekly unit is required.',
              'any.only': 'Invalid unit for weekly authorization interval.',
              'string.base': 'Unit must be a string.',
              'string.empty': 'Unit cannot be empty.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Weekly value is required.',
              'number.positive': 'Weekly value must be a positive number.',
              'number.base': 'Value must be a number.',
            }),
          }),
          fortnightly: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Fortnightly unit is required.',
              'any.only':
                'Invalid unit for fortnightly authorization interval.',
              'string.base': 'Unit must be a string.',
              'string.empty': 'Unit cannot be empty.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Fortnightly value is required.',
              'number.positive': 'Fortnightly value must be a positive number.',
              'number.base': 'Value must be a number.',
            }),
          }),
          monthly: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Monthly unit is required.',
              'any.only': 'Invalid unit for monthly authorization interval.',
              'string.base': 'Unit must be a string.',
              'string.empty': 'Unit cannot be empty.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Monthly value is required.',
              'number.positive': 'Monthly value must be a positive number.',
              'number.base': 'Value must be a number.',
            }),
          }),
        }),
      }),
      notificationTemplates: Joi.array().optional().messages({
        'array.base': 'Notification templates must be an array.',
      }),
    });

    const {error} = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }

  async validateFee(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      type: Joi.string().valid('legalFee', 'serviceFee').required().messages({
        'any.required': 'Fee type is required.',
        'string.base': 'Fee type must be a string.',
        'string.empty': 'Fee type cannot be an empty string.',
        'any.only': 'Fee type is invalid',
      }),
      fee: Joi.number().positive().required().messages({
        'any.required': 'Fee is required.',
        'number.positive': 'Fee must be a positive number.',
        'number.base': 'Fee must be a number.',
      }),
    });

    const {error} = schema.validate({...req.query, ...req.body});
    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }
}

export default new SettingValidate();
