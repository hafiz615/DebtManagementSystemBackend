import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class CustomFieldRequest {
  async addCustomField(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string().required().messages({
        'string.base': 'The name must be a string.',
        'string.empty': 'The name field cannot be empty.',
        'any.required': 'The name field is required.',
      }),
      type: Joi.string().valid('date', 'number', 'text').required().messages({
        'string.base': 'The type must be a string.',
        'string.empty': 'The type field cannot be empty.',
        'any.required': 'The type field is required.',
        'any.only': 'The type must be one of: date, number, or text.',
      }),
      description: Joi.string().optional().allow('').messages({
        'string.base': 'The description must be a string.',
        'string.empty': 'The description field cannot be empty.',
      }),
      target: Joi.string().valid('case').required().messages({
        'string.base': 'The target must be a string.',
        'string.empty': 'The target field cannot be empty.',
        'any.required': 'The target field is required.',
        'any.only': 'The target must be "case".',
      }),
      shared: Joi.boolean().optional().messages({
        'boolean.base': 'The shared field must be a boolean.',
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

export default new CustomFieldRequest();
