import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();

class CreditorRequests {
  validateCreditor = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      basicInformation: Joi.object({
        fullName: Joi.string().required().messages({
          'any.required': 'Full name is required.',
          'string.empty': 'Full name cannot be empty.',
          'string.base': 'Full name must be a string.',
        }),
        email: Joi.string().email().required().messages({
          'any.required': 'Email is required.',
          'string.empty': 'Email cannot be empty.',
          'string.email': 'Invalid email format.',
          'string.base': 'Email must be a string.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'any.required': 'Phone number is required.',
            'string.empty': 'Phone number cannot be empty.',
            'string.base': 'Phone number must be a string.',
            'string.pattern.base': 'Phone number must be exactly 10 digits.',
          }),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required().messages({
          'any.required': 'Company name is required.',
          'string.empty': 'Company name cannot be empty.',
          'string.base': 'Company name must be a string.',
        }),
        businessCategory: Joi.string().allow('').messages({
          'string.base': 'Business category must be a string.',
        }),
      }),
      accountTitle: Joi.string().optional().allow('', null).messages({
        'string.base': 'Account title must be a string.',
      }),
      contact: Joi.object({
        name: Joi.string().allow('').messages({
          'string.base': 'Contact name must be a string.',
        }),
        title: Joi.string().allow('').messages({
          'string.base': 'Contact title must be a string.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .allow('')
          .messages({
            'string.base': 'Contact phone number must be a string.',
            'string.pattern.base': 'Contact phone number must be 10 digits.',
          }),
        email: Joi.string().email().allow('').messages({
          'string.email': 'Invalid contact email format.',
          'string.base': 'Contact email must be a string.',
        }),
        relationWithCreditor: Joi.string().allow('').messages({
          'string.base': 'Relation with creditor must be a string.',
        }),
        state: Joi.string().allow('').messages({
          'string.base': 'State must be a string.',
        }),
        city: Joi.string().allow('').messages({
          'string.base': 'City must be a string.',
        }),
        zipCode: Joi.string().allow('').messages({
          'string.base': 'Zip code must be a string.',
        }),
        _id: Joi.string().optional().messages({
          'string.base': 'ID must be a string.',
        }),
      }),
      paymentToken: Joi.string().optional().allow('').messages({
        'string.base': 'Payment token must be a string.',
      }),
      paymentType: Joi.string().optional().allow('').messages({
        'string.base': 'Payment type must be a string.',
      }),
      paynoteSourceId: Joi.string().optional().allow('').messages({
        'string.base': 'Paynote source ID must be a string.',
      }),
      paynoteUserId: Joi.string().optional().allow('').messages({
        'string.base': 'Paynote user ID must be a string.',
      }),
      lastFundedDate: Joi.date().optional().allow('').messages({
        'date.base': 'Last funded date must be a valid date.',
      }),
      historicalRange: Joi.object({
        minimum: Joi.number().strict().optional().messages({
          'number.base': 'Minimum historical range must be a number.',
        }),
        maximum: Joi.number().strict().optional().messages({
          'number.base': 'Maximum historical range must be a number.',
        }),
      })
        .optional()
        .allow(null),
      aggression: Joi.number().optional().min(0).max(10).messages({
        'number.base': 'Aggression must be a number.',
        'number.min': 'Aggression must be at least 0.',
        'number.max': 'Aggression must not exceed 10.',
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
  };

  validateMultipleCreditors = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      cases: Joi.array()
        .items(
          Joi.object({
            _id: Joi.string().optional().allow('').messages({
              'string.base': 'Case ID must be a string.',
            }),
            totalDebt: Joi.number().strict().optional().messages({
              'number.base': 'Total debt must be a number.',
            }),
            lastPaymentDate: Joi.date().optional().allow('').messages({
              'date.base': 'Last payment date must be a valid date.',
            }),
            paidAmount: Joi.number().strict().optional().messages({
              'number.base': 'Paid amount must be a number.',
            }),
            remaining: Joi.number().strict().optional().messages({
              'number.base': 'Remaining amount must be a number.',
            }),
            confidence: Joi.number().strict().messages({
              'number.base': 'Confidence must be a number.',
            }),
            contractDetails: Joi.object().optional().allow(null).messages({
              'object.base': 'Contract details must be an object.',
            }),
            status: Joi.string().optional().allow('').messages({
              'string.base': 'Status must be a string.',
            }),
            feePayment: Joi.string()
              .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
              .optional()
              .allow('')
              .messages({
                'string.base': 'Fee payment must be a string.',
                'any.only':
                  'Fee payment must be one of [paidViaCash, toPay, paidViaThirdParty].',
              }),
            creditor: Joi.object({
              aggression: Joi.number().optional().min(0).max(10).messages({
                'number.base': 'Aggression must be a number.',
                'number.min': 'Aggression must be at least 0.',
                'number.max': 'Aggression must not exceed 10.',
              }),
              _id: Joi.string().optional().allow('').messages({
                'string.base': 'Creditor ID must be a string.',
              }),
              paymentType: Joi.string().allow('').messages({
                'string.base': 'Payment type must be a string.',
              }),
              paymentToken: Joi.string().allow('').messages({
                'string.base': 'Payment token must be a string.',
              }),
              basicInformation: Joi.object({
                fullName: Joi.string().required().messages({
                  'any.required': 'Creditor full name is required.',
                  'string.empty': 'Creditor full name cannot be empty.',
                  'string.base': 'Creditor full name must be a string.',
                }),
                email: Joi.string().email().required().messages({
                  'any.required': 'Creditor email is required.',
                  'string.empty': 'Creditor email cannot be empty.',
                  'string.email': 'Invalid creditor email format.',
                  'string.base': 'Creditor email must be a string.',
                }),
                phone: Joi.string()
                  .pattern(/^\d{10}$/)
                  .required()
                  .messages({
                    'any.required': 'Creditor phone number is required.',
                    'string.empty': 'Creditor phone number cannot be empty.',
                    'string.base': 'Creditor phone number must be a string.',
                    'string.pattern.base':
                      'Creditor phone number must be exactly 10 digits.',
                  }),
              }),
              businessInformation: Joi.object({
                companyName: Joi.string().required().messages({
                  'any.required': 'Creditor company name is required.',
                  'string.empty': 'Creditor company name cannot be empty.',
                  'string.base': 'Creditor company name must be a string.',
                }),
                businessCategory: Joi.string().allow('').messages({
                  'string.base': 'Creditor business category must be a string.',
                }),
              }),
              contacts: Joi.array()
                .items(
                  Joi.object({
                    name: Joi.string().required().messages({
                      'any.required': 'Contact name is required.',
                      'string.empty': 'Contact name cannot be empty.',
                      'string.base': 'Contact name must be a string.',
                    }),
                    title: Joi.string().required().messages({
                      'any.required': 'Contact title is required.',
                      'string.empty': 'Contact title cannot be empty.',
                      'string.base': 'Contact title must be a string.',
                    }),
                    phone: Joi.string()
                      .pattern(/^\d{10}$/)
                      .required()
                      .messages({
                        'any.required': 'Contact phone number is required.',
                        'string.empty': 'Contact phone number cannot be empty.',
                        'string.base': 'Contact phone number must be a string.',
                        'string.pattern.base':
                          'Contact phone number must be exactly 10 digits.',
                      }),
                    email: Joi.string().email().allow('').messages({
                      'string.email': 'Invalid contact email format.',
                      'string.base': 'Contact email must be a string.',
                    }),
                    relationWithCreditor: Joi.string().allow('').messages({
                      'string.base': 'Relation with creditor must be a string.',
                    }),
                    state: Joi.string().allow('').messages({
                      'string.base': 'State must be a string.',
                    }),
                    city: Joi.string().allow('').messages({
                      'string.base': 'City must be a string.',
                    }),
                    zipCode: Joi.string().allow('').messages({
                      'string.base': 'Zip code must be a string.',
                    }),
                    _id: Joi.string().optional().messages({
                      'string.base': 'Contact ID must be a string.',
                    }),
                  })
                )
                .optional()
                .messages({
                  'array.base': 'Contacts must be an array.',
                }),
              notes: Joi.string().allow('').messages({
                'string.base': 'Notes must be a string.',
              }),
              creditorSecurityKey: Joi.string().optional().allow('').messages({
                'string.base': 'Creditor security key must be a string.',
              }),
              paynoteSourceId: Joi.string().optional().allow('').messages({
                'string.base': 'Paynote source ID must be a string.',
              }),
              paynoteUserId: Joi.string().optional().allow('').messages({
                'string.base': 'Paynote user ID must be a string.',
              }),
              accountTitle: Joi.string().optional().allow('', null).messages({
                'string.base': 'Account title must be a string.',
              }),
              lastFundedDate: Joi.date().optional().allow('').messages({
                'date.base': 'Last funded date must be a valid date.',
              }),
              historicalRange: Joi.object({
                minimum: Joi.number().strict().optional().messages({
                  'number.base': 'Historical range minimum must be a number.',
                }),
                maximum: Joi.number().strict().optional().messages({
                  'number.base': 'Historical range maximum must be a number.',
                }),
              }),
            })
              .optional()
              .allow(null),
          })
        )
        .messages({
          'array.base': 'Cases must be an array.',
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
  };

  async syncEmail(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        'any.required': 'Email is required.',
        'string.empty': 'Email cannot be empty.',
        'string.email': 'Invalid email format.',
        'string.base': 'Email must be a string.',
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

export default new CreditorRequests();
