import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class PaymentValidate {
  async addACHDetails(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      data: Joi.string().required().messages({
        'string.base': 'Data must be a string.',
        'string.empty': 'Data cannot be empty.',
        'any.required': 'Data is a required field.',
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

  async addAccount(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      platform: Joi.string()
        .valid('Seamlesschex', 'Paynote')
        .required()
        .messages({
          'string.base': 'Platform must be a string.',
          'string.empty': 'Platform cannot be empty.',
          'any.only': 'Platform must be one of Seamlesschex or Paynote.',
          'any.required': 'Platform is a required field.',
        }),

      data: Joi.string().required().messages({
        'string.base': 'Data must be a string.',
        'string.empty': 'Data cannot be empty.',
        'any.required': 'Data is a required field.',
      }),

      bank_routing: Joi.string().allow('').messages({
        'string.base': 'Bank routing must be a string.',
        'any.required': 'Bank routing is a required field.',
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

  async updateACHDetails(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      data: Joi.string().required().messages({
        'string.base': 'Data must be a string.',
        'string.empty': 'Data cannot be empty.',
        'any.required': 'Data is a required field.',
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

  async updatePaymentLinkStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const schema = Joi.object({
      status: Joi.string().valid('Success', 'Failed').required().messages({
        'string.base': 'Status must be a string.',
        'string.empty': 'Status cannot be empty.',
        'any.only': 'Status must be one of Success or Failed.',
        'any.required': 'Status is a required field.',
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

  async updatePaymentInvoiceStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const schema = Joi.object({
      status: Joi.string().valid('Success', 'Failed').required().messages({
        'string.base': 'Status must be a string.',
        'string.empty': 'Status cannot be empty.',
        'any.only': 'Status must be one of Success or Failed.',
        'any.required': 'Status is a required field.',
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

  async updatePaymentDate(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      date: Joi.date().required().messages({
        'date.base': 'Date must be a valid date.',
        'any.required': 'Date is required.',
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

export default new PaymentValidate();
