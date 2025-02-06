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
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
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

      notificationId: Joi.string()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
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

      inboxId: Joi.string()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
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
