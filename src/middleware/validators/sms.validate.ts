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
      caseIds: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base':
                'Each Case Id must be a valid MongoDB ObjectId.',
              'string.empty': 'Each Case Id cannot be empty.',
            })
        )
        .min(1) // Ensures at least one CaseId is provided
        .required()
        .messages({
          'array.base': 'Case Ids must be an array.',
          'array.min': 'At least one Case Id is required.',
          'any.required': 'Case Ids are required.',
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
