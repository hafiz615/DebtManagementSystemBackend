import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class SeemlesschexValidate {
  async createCheck(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      transactionIds: Joi.array().items(
        Joi.string().required().messages({
          'any.required': 'Transaction IDs are required.',
          'array.base': 'Transaction IDs must be an array.',
          'string.empty': 'Transaction ID cannot be empty.',
        })
      ),
      amount: Joi.number().required().messages({
        'any.required': 'Amount is required.',
        'number.base': 'Amount must be a number.',
        'number.empty': 'Amount cannot be empty.',
      }),
      commission: Joi.number().required().messages({
        'any.required': 'Commission is required.',
        'number.base': 'Commission must be a number.',
        'number.empty': 'Commission cannot be empty.',
      }),
      transactionDate: Joi.date().required().messages({
        'any.required': 'Transaction date is required.',
        'date.base': 'Transaction date must be a valid date.',
        'date.empty': 'Transaction date cannot be empty.',
      }),
      transactionType: Joi.string()
        .valid('Wire', 'Check', 'Cash')
        .required()
        .messages({
          'any.required': 'Transaction type is required.',
          'any.only': 'Transaction type must be one of [Wire, Check, Cash].',
          'string.empty': 'Transaction type cannot be empty.',
          'string.base': 'Transaction type must be a string.',
        }),
      referenceId: Joi.string().allow('').messages({
        'string.base': 'Reference ID must be a string.',
      }),
      data: Joi.string().required().messages({
        'any.required': 'Data is required.',
        'string.base': 'Data must be a string.',
        'string.empty': 'Data cannot be empty.',
      }),
      debtorId: Joi.string().required().messages({
        'any.required': 'Debtor ID is required.',
        'string.base': 'Debtor ID must be a string.',
        'string.empty': 'Debtor ID cannot be empty.',
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

  async createPaymentLink(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      amount: Joi.number().strict().required().messages({
        'any.required': 'Amount is required.',
        'number.base': 'Amount must be a number.',
        'number.empty': 'Amount cannot be empty.',
      }),
      debtorId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/) // Matches a valid MongoDB ObjectId
        .required()
        .messages({
          'any.required': 'Debtor ID is required.',
          'string.pattern.base': 'Debtor ID is invalid.',
          'string.empty': 'Debtor ID cannot be empty.',
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

  async updateCheck(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      data: Joi.string().required().messages({
        'any.required': 'Data is required.',
        'string.base': 'Data must be a string.',
        'string.empty': 'Data cannot be empty.',
      }),
      checkId: Joi.string().required().messages({
        'any.required': 'Check ID is required.',
        'string.base': 'Check ID must be a string.',
        'string.empty': 'Check ID cannot be empty.',
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

  async voidCheck(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      checkId: Joi.string().required().messages({
        'any.required': 'Check ID is required.',
        'string.base': 'Check ID must be a string.',
        'string.empty': 'Check ID cannot be empty.',
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

export default new SeemlesschexValidate();
