import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
class StatusValidate {
  async addStatus(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      status: Joi.string().required(),
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

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.string().required(),
      update: Joi.string().required(),
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

  async updateStatusArray(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      status: Joi.array().items(Joi.string()),
    });

    const {error} = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      console.log(error.details[0]);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(
          responseHelper.get4xxResponse(
            error.details[0].context.label + constants.Messages.INVALID_FIELD
          )
        );
    }
  }

  async deleteStatus(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.string().required(),
      update: Joi.string().allow(''),
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
export default new StatusValidate();
