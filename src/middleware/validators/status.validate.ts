import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class StatusValidate {
  async addStatus(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      status: Joi.string().required().messages({
        'any.required': 'Status is required.',
        'string.base': 'Status must be a string.',
        'string.empty': 'Status cannot be an empty string.',
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

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.string().required().messages({
        'any.required': 'Original status is required.',
        'string.base': 'Original status must be a string.',
        'string.empty': 'Original status cannot be an empty string.',
      }),
      update: Joi.string().required().messages({
        'any.required': 'Updated status is required.',
        'string.base': 'Updated status must be a string.',
        'string.empty': 'Updated status cannot be an empty string.',
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

  async updateStatusArray(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      status: Joi.array()
        .items(
          Joi.string().messages({
            'string.base': 'Each status must be a string.',
            'string.empty': 'Each status cannot be an empty string.',
          })
        )
        .required()
        .messages({
          'any.required': 'Status array is required.',
          'array.base': 'Status must be an array.',
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

  async deleteStatus(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.string().required().messages({
        'any.required': 'Original status is required.',
        'string.base': 'Original status must be a string.',
        'string.empty': 'Original status cannot be an empty string.',
      }),
      update: Joi.string().required().messages({
        'any.required': 'Updated status is required.',
        'string.base': 'Updated status must be a string.',
        'string.empty': 'Updated status cannot be an empty string.',
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
