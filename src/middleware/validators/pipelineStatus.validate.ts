import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
class PipelineStatusValidate {
  async addPipeline(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      pipeline: Joi.string().required(),
      status: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          type: Joi.string().valid('Active', 'Won', 'Lost').required(),
        }).optional()
      ),
      description: Joi.string().allow(''),
      userId: Joi.string().allow('').optional(),
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

  async updateStatusPipeline(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('Active', 'Won', 'Lost').required(),
      }).required(),
      update: Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('Active', 'Won', 'Lost').required(),
      }).required(),
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

  async deleteStatusPipeline(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('Active', 'Won', 'Lost').required(),
      }).required(),
      update: Joi.object({
        name: Joi.string(),
        type: Joi.string().valid('Active', 'Won', 'Lost'),
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
  }
}
export default new PipelineStatusValidate();
