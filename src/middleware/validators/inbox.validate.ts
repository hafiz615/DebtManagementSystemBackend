import {NextFunction, Request, Response} from 'express';
import Joi from 'joi';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';

class InboxRequests {
  async createMessage(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      subject: Joi.string().required().min(3).max(255).messages({
        'any.required': 'Subject is required.',
        'string.base': 'Subject must be a string.',
        'string.empty': 'Subject cannot be empty.',
        'string.min': 'Subject must be at least 3 characters long.',
        'string.max':
          'Subject must be less than or equal to 255 characters long.',
      }),
      name: Joi.string().required().min(3).max(255).messages({
        'any.required': 'Name is required.',
        'string.base': 'Name must be a string.',
        'string.empty': 'Name cannot be empty.',
        'string.min': 'Name must be at least 3 characters long.',
        'string.max': 'Name must be less than or equal to 255 characters long.',
      }),
      to: Joi.string().required().messages({
        'any.required': 'To field is required.',
        'string.base': 'To field must be a string.',
        'string.empty': 'To field cannot be empty.',
      }),
      from: Joi.string().required().messages({
        'any.required': 'From field is required.',
        'string.base': 'From field must be a string.',
        'string.empty': 'From field cannot be empty.',
      }),
      cC: Joi.string().required().messages({
        'any.required': 'CC field is required.',
        'string.base': 'CC field must be a string.',
        'string.empty': 'CC field cannot be empty.',
      }),
      text: Joi.string().required().messages({
        'any.required': 'Text content is required.',
        'string.base': 'Text content must be a string.',
        'string.empty': 'Text content cannot be empty.',
      }),
      textAsHtml: Joi.string().required().messages({
        'any.required': 'HTML text content is required.',
        'string.base': 'HTML text content must be a string.',
        'string.empty': 'HTML text content cannot be empty.',
      }),
      type: Joi.string().required().messages({
        'any.required': 'Type field is required.',
        'string.base': 'Type must be a string.',
        'string.empty': 'Type field cannot be empty.',
      }),
      debitorCompanyName: Joi.string().required().messages({
        'any.required': 'Debtor Company Name is required.',
        'string.base': 'Debtor Company Name must be a string.',
        'string.empty': 'Debtor Company Name cannot be empty.',
      }),
      creditorCompanyName: Joi.string().required().messages({
        'any.required': 'Creditor Company Name is required.',
        'string.base': 'Creditor Company Name must be a string.',
        'string.empty': 'Creditor Company Name cannot be empty.',
      }),
      caseCode: Joi.string().required().messages({
        'any.required': 'Case Code is required.',
        'string.base': 'Case Code must be a string.',
        'string.empty': 'Case Code cannot be empty.',
      }),
      isRead: Joi.boolean().required().messages({
        'any.required': 'Read status is required.',
        'boolean.base': 'Read status must be a boolean value.',
      }),
      isDeleted: Joi.boolean().required().messages({
        'any.required': 'Deleted status is required.',
        'boolean.base': 'Deleted status must be a boolean value.',
      }),
    });

    const {error} = schema.validate(req.body, {abortEarly: false});

    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      id: Joi.string().required().length(24).hex().messages({
        'any.required': 'Message ID is required.',
        'string.base': 'Message ID must be a string.',
        'string.empty': 'Message ID cannot be empty.',
        'string.length': 'Message ID must be exactly 24 characters long.',
        'string.hex': 'Message ID must be a valid hexadecimal string.',
      }),
    });

    const {error} = schema.validate(req.params, {abortEarly: false});

    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }
}

export default new InboxRequests();
