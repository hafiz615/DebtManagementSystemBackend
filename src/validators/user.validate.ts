import {NextFunction, Request, Response} from 'express';
import constants from '../utils/constants.util';
import responseHelper from '../utils/responseHelper.util';
import Joi from 'joi';

class UserRequests {
  async createUser(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      role: Joi.string().valid('Negotiator', 'Manager').required(),
      isActive: Joi.string(),
      createdBy: Joi.string().required(),
      SSID: Joi.string()
        .pattern(/^\d{9}$/)
        .required(),
      dateOfBirth: Joi.date().required(),
      phone: Joi.string()
        .pattern(/^\d{10,11}$/)
        .required(),
      gender: Joi.string().valid('Male', 'Female', 'Other').required(),
      address: Joi.string().required(),
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
  async signIn(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().regex(
        constants.passwordRegex,
        constants.Messages.PASSWORD_FORMAT
      ),
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
export default new UserRequests();
