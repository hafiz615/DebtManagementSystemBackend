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
