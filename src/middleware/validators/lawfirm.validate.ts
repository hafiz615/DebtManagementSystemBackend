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
          'string.pattern.base': 'lawfirm PhoneNo must be 10 digits.',
          'any.required': 'lawfirm PhoneNo is a required field.',
        }),
      address: Joi.string().allow('').messages({
        'string.base': 'Lawfirm Address must be a string.',
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
      monthly_subscription_fee: Joi.number().allow('').messages({
        'number.base': 'lawfirm fee must be a number.',
        'any.required': 'lawfirm fee is a required field.',
        'string.empty': 'lawfirm fee cannot be empty',
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

  async assignLawfirmToCase(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      lawfirmId: Joi.string().required().length(24).hex().messages({
        'string.base': 'Lawfirm Id must be a string.',
        'any.required': 'Lawfirm Id is a required field.',
        'string.empty': 'Lawfirm Id cannot be empty',
        'string.length': 'Lawfirm Id must be exactly 24 characters long.',
        'string.hex': 'Lawfirm Id must be a valid hexadecimal string.',
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

  async updateLawsuit(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      balance: Joi.number().strict().required().messages({
        'number.base': 'Balance must be a number',
        'any.required': 'Balance is required',
      }),
      lawsuitDate: Joi.date().required().messages({
        'date.base': 'Lawsuit date must be a valid date.',
        'any.required': 'Lawsuit date is a required field.',
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

  async addAttorney(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string()
        .allow('')
        .messages({'string.base': 'Name must be a string.'}),
      email: Joi.string().email().allow('').messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be a valid email address.',
      }),
      phone: Joi.string()
        .allow('')
        .pattern(/^\d{10}$/)
        .messages({
          'string.base': 'Phone must be a string.',
          'string.pattern.base': 'Phone must be 10 digits.',
        }),
      address: Joi.string()
        .allow('')
        .messages({'string.base': 'Address must be a string.'}),
      city: Joi.string()
        .allow('')
        .messages({'string.base': 'City must be a string.'}),
      SSN: Joi.string()
        .pattern(/^\d{9}$/)
        .allow('')
        .messages({
          'string.pattern.base': 'SSN must be a 9-digit number.',
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
