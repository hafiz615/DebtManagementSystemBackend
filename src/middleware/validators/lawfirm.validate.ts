import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();

class LawfirmValidate {
  async updateLawfirm(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      lawfirmCompanyName: Joi.string().messages({
        'string.base': 'Lawfirm company name must be a string.',
        'any.required': 'Lawfirm company name is a required field.',
        'string.empty': 'Lawfirm company cannot be empty',
      }),
      email: Joi.string().email().messages({
        'string.base': 'Lawfirm Email must be a string.',
        'string.email': 'Lawfirm Email must be a valid email address.',
        'any.required': 'Lawfirm Email is a required field.',
        'string.empty': 'Lawfirm Email cannot be empty',
      }),
      phone: Joi.string()
        .pattern(/^\d{10}$/)
        .required()
        .messages({
          'string.base': 'lawfirm PhoneNo must be a string.',
          'string.pattern.base':
            'lawfirm PhoneNo must must be between 10 digits.',
          'any.required': 'lawfirm PhoneNo is a required field.',
        }),
      address: Joi.string().messages({
        'string.base': 'lawfirm Address must be a string.',
        'any.required': 'lawfirm Address is a required field.',
      }),
      city: Joi.string().messages({
        'string.base': 'lawfirm City must be a string.',
        'any.required': 'lawfirm City is a required field.',
      }),
      state: Joi.string().messages({
        'string.base': 'lawfirm State must be a string.',
        'any.required': 'lawfirm State is a required field.',
      }),
      EIN: Joi.string().pattern(/^\d+$/).messages({
        'string.base': 'lawfirm EIN must be a string.',
        'string.pattern.base': 'lawfirm EIN must contain only digits.',
        'any.required': 'lawfirm EIN is a required field.',
      }),
      lawfirmFee: Joi.number().strict().messages({
        'number.base': 'Lawfirm fee must be a number.',
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

export default new LawfirmValidate();
