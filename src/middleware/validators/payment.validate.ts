import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class PaymentValidate {
  async addACHDetailsCreditor(req: Request, res: Response, next: NextFunction) {
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
}

export default new PaymentValidate();
