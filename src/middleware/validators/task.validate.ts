import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
class StatusValidate {
  async addTask(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      dueDate: Joi.date().required(),
      assignee: Joi.string().required(),
      assigneeId: Joi.string().required(),
      title: Joi.string().required(),
      notes: Joi.string(),
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

  async updateTask(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      dueDate: Joi.date().required(),
      assignee: Joi.string().required(),
      assigneeId: Joi.string().required(),
      status: Joi.string()
        .valid('To do', 'On hold', 'Blocked', 'Completed')
        .required(),
      notes: Joi.string(),
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
