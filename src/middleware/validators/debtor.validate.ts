import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();
class DebtorRequests {
  validateDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      paymentToken: Joi.string().optional().allow(''),
      paymentType: Joi.string().optional().allow(''),
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        country: Joi.string().required(),
        state: Joi.string().required(),
        status: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\+\d{11}$/)
          .required(),
        address: Joi.string().required(),
        weeklyBudget: Joi.number(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required(),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        businessCategory: Joi.string().required(),
        description: Joi.string().allow(''),
        country: Joi.string().required(),
        state: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\+\d{11}$/)
          .required(),
        address: Joi.string().required(),
      }),
      contact: Joi.object({
        name: Joi.string().required(),
        title: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\+\d{11}$/)
          .required(),
        email: Joi.string().email().required(),
        relationWithDebtor: Joi.string().allow(''),
        country: Joi.string().allow(''),
        state: Joi.string().allow(''),
        city: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
      }),
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

  createDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      documents: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      paymentType: Joi.string().allow(''),
      paymentToken: Joi.string().allow(''),
      extractedFields: Joi.array().allow(null).optional(),
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        country: Joi.string().required(),
        state: Joi.string().required(),
        status: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\+\d{11}$/)
          .required(),
        address: Joi.string().required(),
        weeklyBudget: Joi.number(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required(),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        businessCategory: Joi.string().required(),
        description: Joi.string().allow(''),
        country: Joi.string().required(),
        state: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\+\d{11}$/)
          .required(),
        address: Joi.string().required(),
      }),
      contacts: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          title: Joi.string().required(),
          phone: Joi.string()
            .pattern(/^\+\d{11}$/)
            .required(),
          email: Joi.string().email().required(),
          relationWithDebtor: Joi.string().allow(''),
          country: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
        })
      ),
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

export default new DebtorRequests();
