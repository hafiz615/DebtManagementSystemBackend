import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();

class AttorneyValidate {
  async validateCaseId(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      caseId: Joi.string().required().messages({
        'any.required': 'Case ID is required.',
        'string.empty': 'Case ID cannot be empty.',
        'string.base': 'Case ID must be a string.',
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

  async updateAttorney(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string().allow('').messages({
        'string.base': 'Name must be a string.',
      }),
      SSN: Joi.string()
        .pattern(/^\d{9}$/)
        .allow('')
        .messages({
          'string.pattern.base': 'SSN must be a 9-digit number.',
          'string.base': 'SSN must be a string.',
        }),
      city: Joi.string().allow('').messages({
        'string.base': 'City must be a string.',
      }),
      email: Joi.string().email().allow('').messages({
        'string.email': 'Invalid email format.',
        'string.base': 'Email must be a string.',
      }),
      phone: Joi.string()
        .pattern(/^\d{10}$/)
        .allow('')
        .messages({
          'string.base': 'Phone number must be a string.',
          'string.pattern.base': 'Phone number must be exactly 10 digits.',
        }),
      address: Joi.string().allow('').messages({
        'string.base': 'Address must be a string.',
      }),
      attorneyFee: Joi.number().optional().messages({
        'number.base': 'Attorney fee must be a number.',
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

export default new AttorneyValidate();
