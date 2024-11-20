import {NextFunction, Request, Response} from 'express';
import Joi from 'joi';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';

class InboxRequests {
  async createMessage(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      subject: Joi.string().required().min(3).max(255),
      name: Joi.string().required().min(3).max(255),
      to: Joi.string().required(),
      from: Joi.string().required(),
      cC: Joi.string().required(),
      text: Joi.string().required(),
      textAsHtml: Joi.string().required(),
      type: Joi.string().required(),
      debitorCompanyName: Joi.string().required(),
      creditorCompanyName: Joi.string().required(),
      caseCode: Joi.string().required(),
      isRead: Joi.boolean().required(),
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

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      id: Joi.string().required().length(24).hex(),
    });

    const {error} = schema.validate(req.params);
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

export default new InboxRequests();
