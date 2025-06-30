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
        'boolean.empty': 'Read status cannot be empty.',
      }),
      isDeleted: Joi.boolean().required().messages({
        'any.required': 'Deleted status is required.',
        'boolean.base': 'Deleted status must be a boolean value.',
        'boolean.empty': 'Deleted status cannot be empty.',
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

    const {error} = schema.validate(req.params);

    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }

  async sendSmsEmailDebtorCreditor(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const type = String(req.query.type);
    let object = Joi.object({
      sendTo: Joi.string().email().required().messages({
        'string.empty': 'SendTo cannot be empty',
        'any.required': 'SendTo is a required field',
        'string.base': 'SendTo must be a string',
        'string.email': 'SendTo must be a valid email',
      }),
      from: Joi.string().email().required().messages({
        'string.empty': 'From cannot be empty',
        'any.required': 'From is a required field',
        'string.base': 'From must be a string',
        'string.email': 'From must be a valid email',
      }),
      content: Joi.string().required().messages({
        'string.empty': 'Content cannot be empty',
        'any.required': 'Content is a required field',
        'string.base': 'Content must be a string',
      }),
      subject: Joi.string().required().messages({
        'string.empty': 'Subject cannot be empty',
        'any.required': 'Subject is a required field',
        'string.base': 'Subject must be a string',
      }),
      cc: Joi.string()
        .required()
        .messages({
          'string.empty': 'CC cannot be empty',
          'string.base': 'CC must be a string',
        })
        .optional(),
      files: Joi.string().optional().messages({
        'string.base': 'Files must be a string',
      }),
      signedUrls: Joi.string().optional().messages({
        'string.base': 'SignedUrls must be a string',
      }),
    });

    if (req.body?.cc && typeof req.body?.cc === 'string') {
      try {
        if (!Array.isArray(JSON.parse(req.body.cc))) {
          return res
            .status(constants.CODE.BAD_REQUEST)
            .send(responseHelper.get4xxResponse('cc is invalid'));
        }
      } catch (err) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse('cc format is incorrect'));
      }
    }

    if (req.body?.signedUrls && typeof req.body?.signedUrls === 'string') {
      try {
        if (!Array.isArray(JSON.parse(req.body.signedUrls))) {
          return res
            .status(constants.CODE.BAD_REQUEST)
            .send(responseHelper.get4xxResponse('signedUrls is invalid'));
        }
      } catch (err) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse('signedUrls format is incorrect')
          );
      }
    }

    if (type === 'sms') {
      object = Joi.object({
        sendTo: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'string.empty': 'SendTo cannot be empty',
            'any.required': 'SendTo is a required field',
            'string.base': 'SendTo must be a string',
            'string.pattern.base':
              'SendTo must be a valid 10-digit phone number',
          }),
        content: Joi.string().required().messages({
          'string.empty': 'Content cannot be empty',
          'any.required': 'Content is a required field',
          'string.base': 'Content must be a string',
        }),
        subject: Joi.string().optional().messages({
          'string.base': 'Subject must be a string',
        }),
        from: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'string.empty': 'from cannot be empty',
            'any.required': 'from is a required field',
            'string.base': 'from must be a string',
            'string.pattern.base': 'from must be a valid 10-digit phone number',
          }),
      });
    }

    const schema = object;
    const {error} = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }

  async threadsCompleted(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      threadIds: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'Each Thread Id must be a valid id.',
              'string.empty': 'Each Thread Id cannot be empty.',
            })
        )
        .min(1)
        .required()
        .messages({
          'array.base': 'Thread Ids must be an array.',
          'array.min': 'At least one Thread Id is required.',
          'any.required': 'Thread Ids are required.',
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

export default new InboxRequests();
