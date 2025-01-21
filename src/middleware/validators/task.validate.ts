import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class StatusValidate {
  async addTask(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      dueDate: Joi.date().required().messages({
        'any.required': 'Due date is required.',
        'date.base': 'Due date must be a valid date.',
      }),
      assignee: Joi.string().required().messages({
        'any.required': 'Assignee is required.',
        'string.base': 'Assignee must be a string.',
      }),
      assigneeId: Joi.string().required().messages({
        'any.required': 'Assignee ID is required.',
        'string.base': 'Assignee ID must be a string.',
      }),
      title: Joi.string().required().messages({
        'any.required': 'Title is required.',
        'string.base': 'Title must be a string.',
      }),
      notes: Joi.string().messages({
        'string.base': 'Notes must be a string.',
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

  async updateTask(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      dueDate: Joi.date().required().messages({
        'any.required': 'Due date is required.',
        'date.base': 'Due date must be a valid date.',
      }),
      assignee: Joi.string().required().messages({
        'any.required': 'Assignee is required.',
        'string.base': 'Assignee must be a string.',
      }),
      assigneeId: Joi.string().required().messages({
        'any.required': 'Assignee ID is required.',
        'string.base': 'Assignee ID must be a string.',
      }),
      status: Joi.string()
        .valid('To do', 'On hold', 'Blocked', 'Completed')
        .required()
        .messages({
          'any.required': 'Status is required.',
          'any.only':
            'Status must be one of: To do, On hold, Blocked, or Completed.',
          'string.base': 'Status must be a string.',
        }),
      notes: Joi.string().messages({
        'string.base': 'Notes must be a string.',
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

export default new StatusValidate();
