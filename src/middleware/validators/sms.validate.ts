import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
import mongoose from 'mongoose';

class SmsValidate {
  async saveCaseDetailNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const schema = Joi.object({
      caseId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/) // Matches a valId MongoDB ObjectId
        .required()
        .messages({
          'any.required': 'Case Id is required.',
          'string.pattern.base': 'Case Id is invalid.',
          'string.empty': 'Case Id cannot be empty.',
        }),

      notificationId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/) // Matches a valId MongoDB ObjectId
        .required()
        .messages({
          'any.required': 'Notification Id is required.',
          'string.pattern.base': 'Notification Id is invalid.',
          'string.empty': 'Notification Id cannot be empty.',
        }),

      inboxId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/) // Matches a valId MongoDB ObjectId
        .required()
        .messages({
          'any.required': 'Inbox Id is required.',
          'string.pattern.base': 'Inbox Id is invalid.',
          'string.empty': 'Inbox Id cannot be empty.',
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

export default new SmsValidate();
