import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();

class CaseValidate {
  async getLawSuitBalanceSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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
}

export default new CaseValidate();
