import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class PipelineStatusValidate {
  async addPipeline(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      pipeline: Joi.string().required().messages({
        'string.base': 'Pipeline must be a string.',
        'any.required': 'Pipeline is a required field.',
      }),
      status: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required().messages({
              'string.base': 'Status name must be a string.',
              'any.required': 'Status name is a required field.',
            }),
            type: Joi.string()
              .valid('Active', 'Won', 'Lost')
              .required()
              .messages({
                'string.base': 'Status type must be a string.',
                'any.only': 'Status type must be one of Active, Won, or Lost.',
                'any.required': 'Status type is a required field.',
              }),
          }).optional()
        )
        .messages({
          'array.base': 'Status must be an array of objects.',
        }),
      description: Joi.string().allow('').messages({
        'string.base': 'Description must be a string.',
      }),
      userId: Joi.string().allow('').optional().messages({
        'string.base': 'User ID must be a string.',
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

  async addStatusPipeline(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string().required().messages({
        'string.base': 'Name must be a string.',
        'any.required': 'Name is a required field.',
      }),
      type: Joi.string().valid('Active', 'Won', 'Lost').required().messages({
        'string.base': 'Type must be a string.',
        'any.only': 'Type must be one of Active, Won, or Lost.',
        'any.required': 'Type is a required field.',
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

  async updateStatusPipeline(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.object({
        name: Joi.string().required().messages({
          'string.base': 'Original name must be a string.',
          'any.required': 'Original name is a required field.',
        }),
        type: Joi.string().valid('Active', 'Won', 'Lost').required().messages({
          'string.base': 'Original type must be a string.',
          'any.only': 'Original type must be one of Active, Won, or Lost.',
          'any.required': 'Original type is a required field.',
        }),
      })
        .required()
        .messages({
          'any.required': 'Original object is required.',
          'object.base': 'Original must be an object.',
        }),
      update: Joi.object({
        name: Joi.string().required().messages({
          'string.base': 'Updated name must be a string.',
          'any.required': 'Updated name is a required field.',
        }),
        type: Joi.string().valid('Active', 'Won', 'Lost').required().messages({
          'string.base': 'Updated type must be a string.',
          'any.only': 'Updated type must be one of Active, Won, or Lost.',
          'any.required': 'Updated type is a required field.',
        }),
      })
        .required()
        .messages({
          'any.required': 'Update object is required.',
          'object.base': 'Update must be an object.',
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

  async deleteStatusPipeline(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      original: Joi.object({
        name: Joi.string().required().messages({
          'string.base': 'Original name must be a string.',
          'any.required': 'Original name is a required field.',
        }),
        type: Joi.string().valid('Active', 'Won', 'Lost').required().messages({
          'string.base': 'Original type must be a string.',
          'any.only': 'Original type must be one of Active, Won, or Lost.',
          'any.required': 'Original type is a required field.',
        }),
      })
        .required()
        .messages({
          'any.required': 'Original object is required.',
          'object.base': 'Original must be an object.',
        }),
      update: Joi.object({
        name: Joi.string().messages({
          'string.base': 'Updated name must be a string.',
        }),
        type: Joi.string().valid('Active', 'Won', 'Lost').messages({
          'string.base': 'Updated type must be a string.',
          'any.only': 'Updated type must be one of Active, Won, or Lost.',
        }),
      }).messages({
        'object.base': 'Update must be an object.',
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

export default new PipelineStatusValidate();
