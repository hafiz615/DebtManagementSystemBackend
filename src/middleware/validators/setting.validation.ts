import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
import {values} from 'lodash';
import {Events, User} from '../../enums';

class SettingValidate {
  async validateNotificationConfiguration(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const schema = Joi.object({
      label: Joi.string().optional().allow('', null),
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
              }),
            sms_allowed: Joi.boolean().required().messages({
              'any.required': 'SMS permission is required.',
            }),
            email_allowed: Joi.boolean().required().messages({
              'any.required': 'Email permission is required.',
            }),
            sms_template: Joi.string().allow(''),
            email_template: Joi.string().allow(''),
          })
        )
        .required()
        .messages({
          'any.required': 'User permission details are required.',
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
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Failed authorization value is required.',
              'number.positive':
                'Failed authorization value must be a positive number.',
            }),
            maxRetry: Joi.number().positive().required().messages({
              'any.required': 'Max retry for failed authorization is required.',
              'number.positive': 'Max retry must be a positive number.',
            }),
          }),
          failedPayment: Joi.object({
            unit: Joi.string().valid('days', 'hours').required().messages({
              'any.required': 'Failed payment unit is required.',
              'any.only': 'Invalid unit for failed payment.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Failed payment value is required.',
              'number.positive':
                'Failed payment value must be a positive number.',
            }),
            maxRetry: Joi.number().positive().required().messages({
              'any.required': 'Max retry for failed payment is required.',
              'number.positive': 'Max retry must be a positive number.',
            }),
          }),
        }),
        authorizationInterval: Joi.object({
          custom: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Custom unit is required.',
              'any.only': 'Invalid unit for custom authorization interval.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Custom value is required.',
              'number.positive': 'Custom value must be a positive number.',
            }),
          }),
          daily: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Daily unit is required.',
              'any.only': 'Invalid unit for daily authorization interval.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Daily value is required.',
              'number.positive': 'Daily value must be a positive number.',
            }),
          }),
          weekly: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Weekly unit is required.',
              'any.only': 'Invalid unit for weekly authorization interval.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Weekly value is required.',
              'number.positive': 'Weekly value must be a positive number.',
            }),
          }),
          fortnightly: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Fortnightly unit is required.',
              'any.only':
                'Invalid unit for fortnightly authorization interval.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Fortnightly value is required.',
              'number.positive': 'Fortnightly value must be a positive number.',
            }),
          }),
          monthly: Joi.object({
            unit: Joi.string().valid('hours', 'days').required().messages({
              'any.required': 'Monthly unit is required.',
              'any.only': 'Invalid unit for monthly authorization interval.',
            }),
            value: Joi.number().positive().required().messages({
              'any.required': 'Monthly value is required.',
              'number.positive': 'Monthly value must be a positive number.',
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
}

export default new SettingValidate();
