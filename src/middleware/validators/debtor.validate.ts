import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();
class DebtorRequests {
  validateDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      paymentToken: Joi.string().optional().allow(''),
      paymentType: Joi.string().optional().allow(''),
      profitMargin: Joi.number().optional(),
      basicInformation: Joi.object({
        fullName: Joi.string().required().messages({
          'any.required': 'Full Name is a required field.',
        }),
        email: Joi.string().email().required().messages({
          'any.required': 'Email is a required field.',
          'string.email': 'Email must be a valid email address.',
        }),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'SSID is a required field.',
            'string.pattern.base': 'SSID must be a 9-digit number.',
          }),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
        }),
        status: Joi.string().required().messages({
          'any.required': 'Status is a required field.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'any.required': 'Phone number is a required field.',
            'string.pattern.base': 'Phone number must be a 10-digit number.',
          }),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
        }),
        weeklyBudget: Joi.number().optional(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required().messages({
          'any.required': 'Company Name is a required field.',
        }),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'EIN is a required field.',
            'string.pattern.base': 'EIN must be a 9-digit number.',
          }),
        businessCategory: Joi.string().required().messages({
          'any.required': 'Business Category is a required field.',
        }),
        description: Joi.string().allow(''),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
        }),
        phone: Joi.string().pattern(/^\d{10}$/),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
        }),
      }),
      contact: Joi.object({
        name: Joi.string().required().messages({
          'any.required': 'Contact Name is a required field.',
        }),
        title: Joi.string().required().messages({
          'any.required': 'Title is a required field.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'any.required': 'Contact Phone number is a required field.',
            'string.pattern.base':
              'Contact Phone number must be a 10-digit number.',
          }),
        email: Joi.string().email().required().messages({
          'any.required': 'Contact Email is a required field.',
          'string.email': 'Contact Email must be a valid email address.',
        }),
        relationWithDebtor: Joi.string().allow(''),
        state: Joi.string().allow(''),
        city: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
        _id: Joi.string().optional(),
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

  createDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      documents: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      mcaDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      bankStatementDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      otherDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      paymentType: Joi.string().allow(''),
      paymentToken: Joi.string().allow(''),
      extractedFields: Joi.array().allow(null).optional(),
      profitMargin: Joi.number().optional(),
      basicInformation: Joi.object({
        fullName: Joi.string().required().messages({
          'any.required': 'Full Name is a required field.',
        }),
        email: Joi.string().email().required().messages({
          'any.required': 'Email is a required field.',
          'string.email': 'Email must be a valid email address.',
        }),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'SSID is a required field.',
            'string.pattern.base': 'SSID must be a 9-digit number.',
          }),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
        }),
        status: Joi.string().required().messages({
          'any.required': 'Status is a required field.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'any.required': 'Phone number is a required field.',
            'string.pattern.base': 'Phone number must be a 10-digit number.',
          }),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
        }),
        weeklyBudget: Joi.number().optional(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required().messages({
          'any.required': 'Company Name is a required field.',
        }),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'EIN is a required field.',
            'string.pattern.base': 'EIN must be a 9-digit number.',
          }),
        businessCategory: Joi.string().required().messages({
          'any.required': 'Business Category is a required field.',
        }),
        description: Joi.string().allow(''),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
        }),
        phone: Joi.string().pattern(/^\d{10}$/),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
        }),
      }),
      contacts: Joi.array().items(
        Joi.object({
          name: Joi.string().required().messages({
            'any.required': 'Contact Name is a required field.',
          }),
          title: Joi.string().required().messages({
            'any.required': 'Title is a required field.',
          }),
          phone: Joi.string()
            .pattern(/^\d{10}$/)
            .required()
            .messages({
              'any.required': 'Contact Phone number is a required field.',
              'string.pattern.base':
                'Contact Phone number must be a 10-digit number.',
            }),
          email: Joi.string().email().required().messages({
            'any.required': 'Contact Email is a required field.',
            'string.email': 'Contact Email must be a valid email address.',
          }),
          relationWithDebtor: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
        })
      ),
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

  updateDebtorBulk = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      documents: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'Document key must be a string',
              'any.required': 'Document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'any.required': 'Original file name is required',
            }),
          })
        )
        .optional(),
      mcaDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'MCA document key must be a string',
              'any.required': 'MCA document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'MCA original file name must be a string',
              'any.required': 'MCA original file name is required',
            }),
          })
        )
        .optional(),
      bankStatementDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'Bank statement key must be a string',
              'any.required': 'Bank statement key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base':
                'Bank statement original file name must be a string',
              'any.required': 'Bank statement original file name is required',
            }),
          })
        )
        .optional(),
      otherDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'Other document key must be a string',
              'any.required': 'Other document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base':
                'Other document original file name must be a string',
              'any.required': 'Other document original file name is required',
            }),
          })
        )
        .optional(),
      paymentType: Joi.string().allow('').messages({
        'string.base': 'Payment type must be a string',
      }),
      paymentToken: Joi.string().allow('').messages({
        'string.base': 'Payment token must be a string',
      }),
      extractedFields: Joi.array().allow(null).optional().messages({
        'array.base': 'Extracted fields must be an array',
      }),
      profitMargin: Joi.number().optional().messages({
        'number.base': 'Profit margin must be a number',
      }),
      basicInformation: Joi.object({
        fullName: Joi.string().required().messages({
          'string.base': 'Full name must be a string',
          'any.required': 'Full name is required',
        }),
        email: Joi.string().email().required().messages({
          'string.email': 'Email must be a valid email address',
          'any.required': 'Email is required',
        }),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'string.pattern.base': 'SSID must be a 9-digit number',
            'any.required': 'SSID is required',
          }),
        state: Joi.string().required().messages({
          'string.base': 'State must be a string',
          'any.required': 'State is required',
        }),
        status: Joi.string().required().messages({
          'string.base': 'Status must be a string',
          'any.required': 'Status is required',
        }),
        city: Joi.string().required().messages({
          'string.base': 'City must be a string',
          'any.required': 'City is required',
        }),
        zipCode: Joi.string().required().messages({
          'string.base': 'Zip code must be a string',
          'any.required': 'Zip code is required',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'string.pattern.base': 'Phone number must be a 10-digit number',
            'any.required': 'Phone number is required',
          }),
        address: Joi.string().required().messages({
          'string.base': 'Address must be a string',
          'any.required': 'Address is required',
        }),
        weeklyBudget: Joi.number().optional().messages({
          'number.base': 'Weekly budget must be a number',
        }),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required().messages({
          'string.base': 'Company name must be a string',
          'any.required': 'Company name is required',
        }),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'string.pattern.base': 'EIN must be a 9-digit number',
            'any.required': 'EIN is required',
          }),
        businessCategory: Joi.string().required().messages({
          'string.base': 'Business category must be a string',
          'any.required': 'Business category is required',
        }),
        description: Joi.string().allow('').messages({
          'string.base': 'Description must be a string',
        }),
        state: Joi.string().required().messages({
          'string.base': 'State must be a string',
          'any.required': 'State is required',
        }),
        city: Joi.string().required().messages({
          'string.base': 'City must be a string',
          'any.required': 'City is required',
        }),
        zipCode: Joi.string().required().messages({
          'string.base': 'Zip code must be a string',
          'any.required': 'Zip code is required',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .messages({
            'string.pattern.base': 'Phone number must be a 10-digit number',
          }),
        address: Joi.string().required().messages({
          'string.base': 'Address must be a string',
          'any.required': 'Address is required',
        }),
      }),
      contacts: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required().messages({
              'string.base': 'Contact name must be a string',
              'any.required': 'Contact name is required',
            }),
            title: Joi.string().required().messages({
              'string.base': 'Contact title must be a string',
              'any.required': 'Contact title is required',
            }),
            phone: Joi.string()
              .pattern(/^\d{10}$/)
              .required()
              .messages({
                'string.pattern.base':
                  'Contact phone number must be a 10-digit number',
                'any.required': 'Contact phone number is required',
              }),
            email: Joi.string().email().required().messages({
              'string.email': 'Contact email must be a valid email address',
              'any.required': 'Contact email is required',
            }),
            relationWithDebtor: Joi.string().allow('').messages({
              'string.base': 'Relation with debtor must be a string',
            }),
            state: Joi.string().allow('').messages({
              'string.base': 'State must be a string',
            }),
            city: Joi.string().allow('').messages({
              'string.base': 'City must be a string',
            }),
            zipCode: Joi.string().allow('').messages({
              'string.base': 'Zip code must be a string',
            }),
          })
        )
        .messages({
          'array.base': 'Contacts must be an array of objects',
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
  };

  createMultipleDebtors = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      debtors: Joi.array()
        .items(
          Joi.object({
            paymentType: Joi.string().allow('').messages({
              'string.base': 'Payment type must be a string',
            }),
            paymentToken: Joi.string().allow('').messages({
              'string.base': 'Payment token must be a string',
            }),
            extractedFields: Joi.array().allow(null).optional().messages({
              'array.base': 'Extracted fields must be an array',
            }),
            driveUrl: Joi.string().allow('').messages({
              'string.base': 'Drive URL must be a string',
            }),
            profitMargin: Joi.number().optional().messages({
              'number.base': 'Profit margin must be a number',
            }),
            basicInformation: Joi.object({
              fullName: Joi.string().required().allow('').messages({
                'string.base': 'Full name must be a string',
                'any.required': 'Full name is required',
              }),
              email: Joi.string().email().required().allow('').messages({
                'string.email': 'Email must be a valid email address',
                'any.required': 'Email is required',
              }),
              SSID: Joi.string().allow('').messages({
                'string.base': 'SSID must be a string',
              }),
              state: Joi.string().allow('').messages({
                'string.base': 'State must be a string',
              }),
              status: Joi.string().allow('').messages({
                'string.base': 'Status must be a string',
              }),
              city: Joi.string().allow('').messages({
                'string.base': 'City must be a string',
              }),
              zipCode: Joi.string().allow('').messages({
                'string.base': 'Zip code must be a string',
              }),
              phone: Joi.string().allow('').messages({
                'string.base': 'Phone must be a string',
              }),
              address: Joi.string().allow('').messages({
                'string.base': 'Address must be a string',
              }),
              weeklyBudget: Joi.number().optional().messages({
                'number.base': 'Weekly budget must be a number',
              }),
            }),
            businessInformation: Joi.object({
              companyName: Joi.string().required().allow('').messages({
                'string.base': 'Company name must be a string',
                'any.required': 'Company name is required',
              }),
              EIN: Joi.string().allow('').messages({
                'string.base': 'EIN must be a string',
              }),
              businessCategory: Joi.string().allow('').messages({
                'string.base': 'Business category must be a string',
              }),
              description: Joi.string().allow('').messages({
                'string.base': 'Description must be a string',
              }),
              state: Joi.string().allow('').messages({
                'string.base': 'State must be a string',
              }),
              city: Joi.string().allow('').messages({
                'string.base': 'City must be a string',
              }),
              zipCode: Joi.string().allow('').messages({
                'string.base': 'Zip code must be a string',
              }),
              phone: Joi.string().allow('').messages({
                'string.base': 'Phone must be a string',
              }),
              address: Joi.string().allow('').messages({
                'string.base': 'Address must be a string',
              }),
            }),
            contacts: Joi.array()
              .items(
                Joi.object({
                  name: Joi.string().required().messages({
                    'string.base': 'Contact name must be a string',
                    'any.required': 'Contact name is required',
                  }),
                  title: Joi.string().required().messages({
                    'string.base': 'Contact title must be a string',
                    'any.required': 'Contact title is required',
                  }),
                  phone: Joi.string().required().messages({
                    'string.base': 'Contact phone must be a string',
                    'any.required': 'Contact phone is required',
                  }),
                  email: Joi.string().email().required().messages({
                    'string.email':
                      'Contact email must be a valid email address',
                    'any.required': 'Contact email is required',
                  }),
                  relationWithDebtor: Joi.string().allow('').messages({
                    'string.base': 'Relation with debtor must be a string',
                  }),
                  state: Joi.string().allow('').messages({
                    'string.base': 'State must be a string',
                  }),
                  city: Joi.string().allow('').messages({
                    'string.base': 'City must be a string',
                  }),
                  zipCode: Joi.string().allow('').messages({
                    'string.base': 'Zip code must be a string',
                  }),
                })
              )
              .messages({
                'array.base': 'Contacts must be an array',
              }),
          })
        )
        .messages({
          'array.base': 'Debtors must be an array',
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
  };

  addDebtorAccount = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      paymentType: Joi.string().required().messages({
        'string.base': 'Payment type must be a string',
        'any.required': 'Payment type is required',
      }),
      paymentToken: Joi.string().required().messages({
        'string.base': 'Payment token must be a string',
        'any.required': 'Payment token is required',
      }),
      platform: Joi.string()
        .valid('Easypay direct', 'Seamlesschex merchant')
        .required()
        .messages({
          'string.base': 'Platform must be a string',
          'any.required': 'Platform is required',
          'any.only':
            "Platform must be either 'Easypay direct' or 'Seamlesschex merchant'",
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
  };

  saveWeeklyBudgetValues = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      strategy1Profit: Joi.number().strict().messages({
        'number.base': 'Strategy 1 profit must be a number',
      }),
      strategy1Weekly: Joi.number().strict().messages({
        'number.base': 'Strategy 1 weekly value must be a number',
      }),
      strategy1Custom: Joi.number().strict().messages({
        'number.base': 'Strategy 1 custom value must be a number',
      }),
      strategy1Choosen: Joi.string().messages({
        'string.base': 'Strategy 1 chosen value must be a string',
      }),
      strategy3Profit: Joi.number().strict().messages({
        'number.base': 'Strategy 3 profit must be a number',
      }),
      strategy3ProfitMargin: Joi.number().strict().messages({
        'number.base': 'Strategy 3 profit margin must be a number',
      }),
      strategy3Custom: Joi.number().strict().messages({
        'number.base': 'Strategy 3 custom value must be a number',
      }),
      strategy3Choosen: Joi.string().messages({
        'string.base': 'Strategy 3 chosen value must be a string',
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
  };

  validateManualPayment = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      debtorId: Joi.string().required().messages({
        'string.base': 'Debtor ID must be a string',
        'any.required': 'Debtor ID is required',
      }),
      transactionIds: Joi.array().items(Joi.string()).required().messages({
        'array.base': 'Transaction IDs must be an array',
        'any.required': 'Transaction IDs are required',
      }),
      amount: Joi.number().required().messages({
        'number.base': 'Amount must be a number',
        'any.required': 'Amount is required',
      }),
      commission: Joi.number().required().messages({
        'number.base': 'Commission must be a number',
        'any.required': 'Commission is required',
      }),
      transactionDate: Joi.date().required().messages({
        'date.base': 'Transaction date must be a valid date',
        'any.required': 'Transaction date is required',
      }),
      transactionType: Joi.string()
        .valid('Wire', 'Check', 'Cash')
        .required()
        .messages({
          'string.base': 'Transaction type must be a string',
          'any.required': 'Transaction type is required',
          'any.only':
            "Transaction type must be one of ['Wire', 'Check', 'Cash']",
        }),
      referenceId: Joi.string().required().messages({
        'string.base': 'Reference ID must be a string',
        'any.required': 'Reference ID is required',
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
  };

  revertPayment = async (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      commission: Joi.number().required().messages({
        'number.base': 'Commission must be a number',
        'any.required': 'Commission is required',
      }),
      referenceId: Joi.string().required().messages({
        'string.base': 'Reference ID must be a string',
        'any.required': 'Reference ID is required',
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
  };

  updateWeeklyBudget = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      weeklyBudget: Joi.number().strict().required().messages({
        'number.base': 'Weekly budget must be a number',
        'any.required': 'Weekly budget is required',
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
  };

  addDocumentsToDebtor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      mcaDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'MCA document key must be a string',
              'any.required': 'MCA document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'any.required': 'Original file name is required',
            }),
          })
        )
        .optional()
        .messages({
          'array.base': 'MCA documents must be an array',
        }),
      bankStatementDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'Bank statement document key must be a string',
              'any.required': 'Bank statement document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'any.required': 'Original file name is required',
            }),
          })
        )
        .optional()
        .messages({
          'array.base': 'Bank statement documents must be an array',
        }),
      otherDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'Other document key must be a string',
              'any.required': 'Other document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'any.required': 'Original file name is required',
            }),
          })
        )
        .optional()
        .messages({
          'array.base': 'Other documents must be an array',
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
  };

  syncDebtorEmail = async (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
      }),
      platform: Joi.string().required().messages({
        'string.base': 'Platform must be a string',
        'any.required': 'Platform is required',
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
  };
}

export default new DebtorRequests();
