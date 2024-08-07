import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();
class CreditorRequests {
  validateCreditor = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string()
          .pattern(/^\+\d{11}$/)
          .required(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required(),
        businessCategory: Joi.string().required(),
      }),
      accountTitle: Joi.string().optional().allow('', null),
      contact: Joi.object({
        name: Joi.string().required(),
        title: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\+\d{11}$/)
          .required(),
        email: Joi.string().email().required(),
        relationWithCreditor: Joi.string().allow(''),
        country: Joi.string().allow(''),
        state: Joi.string().allow(''),
        city: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
        _id: Joi.string().optional(),
      }),
      lastFundedDate: Joi.date().optional().allow(''),
      historicalRange: Joi.object({
        minimum: Joi.number().strict().optional(),
        maximum: Joi.number().strict().optional(),
      })
        .optional()
        .allow(null),
      aggression: Joi.number().optional().min(0).max(10),
    });
    const {error} = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(
          responseHelper.get4xxResponse(
            error.details[0].context.label + constants.Messages.INVALID_FIELD
          )
        );
    }
  };
}

export default new CreditorRequests();
