import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();
class DebtorRequests {
  validateDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        country: Joi.string().required(),
        state: Joi.string().required(),
        status: Joi.string()
          .valid('Customer', 'On hold', 'Canceled', 'Declared Bankrupcy')
          .required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\d{10,11}$/)
          .required(),
        address: Joi.string().required(),
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
          .pattern(/^\d{10,11}$/)
          .required(),
        address: Joi.string().required(),
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
  };
}

export default new DebtorRequests();
