import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
class CustomFieldRequest {
  async addCustomField(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('date', 'number', 'text').required(),
      description: Joi.string(),
      target: Joi.string().valid('case').required(),
      shared: Joi.boolean(),
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
}
export default new CustomFieldRequest();
