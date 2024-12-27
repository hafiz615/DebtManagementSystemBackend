import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
class SeemlesschexValidate {
  async createCheck(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      transactionIds: Joi.array().items(Joi.string()).required(),
      amount: Joi.number().required(),
      commission: Joi.number().required(),
      transactionDate: Joi.date().required(),
      transactionType: Joi.string().valid('Wire', 'Check', 'Cash').required(),
      referenceId: Joi.string().required(),
      token: Joi.string().required(),
      store: Joi.string().required(),
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
  }

  async createPaymentLink(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      amount: Joi.number().strict().required(),
      debtorId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/) // Matches a valid MongoDB ObjectId
        .required()
        .messages({
          'string.pattern.base': 'Debtor id is invalid',
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
