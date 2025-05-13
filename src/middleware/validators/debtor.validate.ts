import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();
class DebtorRequests {
  validateDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      paymentToken: Joi.string().optional().allow('').messages({
        'string.base': 'Payment token must be a string.',
      }),
      paymentType: Joi.string().optional().allow('').messages({
        'string.base': 'Payment type must be a string.',
      }),
      profitMargin: Joi.number().optional().messages({
        'number.base': 'Profit Margin must be a number.',
      }),
      basicInformation: Joi.object({
        fullName: Joi.string().required().messages({
          'any.required': 'Full Name is a required field.',
          'string.empty': 'Full Name cannot be empty.',
        }),
        email: Joi.string().email().required().messages({
          'any.required': 'Email is a required field.',
          'string.email': 'Email must be a valid email address.',
          'string.empty': 'Email cannot be empty.',
        }),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'SSID is a required field.',
            'string.pattern.base': 'SSID must be a 9-digit number.',
            'string.empty': 'SSID cannot be empty.',
          }),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
          'string.empty': 'State cannot be empty.',
        }),
        status: Joi.string().required().messages({
          'any.required': 'Status is a required field.',
          'string.empty': 'Status cannot be empty.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
          'string.empty': 'City cannot be empty.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
          'string.empty': 'Zip Code cannot be empty.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'any.required': 'Phone number is a required field.',
            'string.pattern.base': 'Phone number must be a 10-digit number.',
            'string.empty': 'Phone number cannot be empty.',
          }),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
          'string.empty': 'Address cannot be empty.',
        }),
        weeklyBudget: Joi.number().optional().messages({
          'number.base': 'Weekly Budget must be a number.',
        }),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required().messages({
          'any.required': 'Company Name is a required field.',
          'string.empty': 'Company Name cannot be empty.',
        }),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'EIN is a required field.',
            'string.pattern.base': 'EIN must be a 9-digit number.',
            'string.empty': 'EIN cannot be empty.',
          }),
        businessCategory: Joi.string().required().messages({
          'any.required': 'Business Category is a required field.',
          'string.empty': 'Business Category cannot be empty.',
        }),
        description: Joi.string().allow('').messages({
          'string.base': 'Description must be a string.',
        }),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
          'string.empty': 'State cannot be empty.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
          'string.empty': 'City cannot be empty.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
          'string.empty': 'Zip Code cannot be empty.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .messages({
            'string.pattern.base': 'Phone number must be a 10-digit number.',
            'string.empty': 'Phone cannot be empty.',
          }),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
          'string.empty': 'Address cannot be empty.',
        }),
      }),
      contact: Joi.object({
        name: Joi.string().required().messages({
          'any.required': 'Contact Name is a required field.',
          'string.empty': 'Contact Name cannot be empty.',
        }),
        title: Joi.string().required().messages({
          'any.required': 'Title is a required field.',
          'string.empty': 'Title cannot be empty.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'any.required': 'Contact Phone number is a required field.',
            'string.pattern.base':
              'Contact Phone number must be a 10-digit number.',
            'string.empty': 'Contact Phone number cannot be empty.',
          }),
        email: Joi.string().email().allow('').messages({
          'string.email': 'Contact Email must be a valid email address.',
          'string.base': 'Contact Email must be a string.',
        }),
        relationWithDebtor: Joi.string().allow('').messages({
          'string.base': 'Relation with debtor must be a string.',
        }),
        state: Joi.string().allow('').messages({
          'string.base': 'State must be a string.',
        }),
        city: Joi.string().allow('').messages({
          'string.base': 'City must be a string.',
        }),
        zipCode: Joi.string().allow('').messages({
          'string.base': 'Zip Code must be a string.',
        }),
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

  async addDebtorInvoice(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      amount: Joi.number().strict().required().messages({
        'any.required': 'Amount is required.',
        'number.base': 'Amount must be a number.',
        'number.empty': 'Amount cannot be empty.',
      }),
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/) // Matches a valid MongoDB ObjectId
        .required()
        .messages({
          'any.required': 'Debtor ID is required.',
          'string.pattern.base': 'Debtor ID is invalid.',
          'string.empty': 'Debtor ID cannot be empty.',
        }),
      platform: Joi.string().required().messages({
        'string.base': 'Platform must be a string',
        'string.empty': 'Platform cannot be empty',
        'any.required': 'Platform is required',
      }),
      email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
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

  createDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      documents: Joi.array().items(
        Joi.object({
          key: Joi.string().required().messages({
            'any.required': 'Document Key is a required field.',
            'string.empty': 'Document Key cannot be empty.',
          }),
          originalFileName: Joi.string().required().messages({
            'any.required': 'Original File Name is a required field.',
            'string.empty': 'Original File Name cannot be empty.',
          }),
        })
      ),
      mcaDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required().messages({
            'any.required': 'MCA Document Key is a required field.',
            'string.empty': 'MCA Document Key cannot be empty.',
          }),
          originalFileName: Joi.string().required().messages({
            'any.required': 'Original File Name is a required field.',
            'string.empty': 'Original File Name cannot be empty.',
          }),
        })
      ),
      bankStatementDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required().messages({
            'any.required': 'Bank Statement Document Key is a required field.',
            'string.empty': 'Bank Statement Document Key cannot be empty.',
          }),
          originalFileName: Joi.string().required().messages({
            'any.required': 'Original File Name is a required field.',
            'string.empty': 'Original File Name cannot be empty.',
          }),
        })
      ),
      otherDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required().messages({
            'any.required': 'Other Document Key is a required field.',
            'string.empty': 'Other Document Key cannot be empty.',
          }),
          originalFileName: Joi.string().required().messages({
            'any.required': 'Original File Name is a required field.',
            'string.empty': 'Original File Name cannot be empty.',
          }),
        })
      ),

      lawsuitDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required().messages({
            'any.required': 'Lawsuit Document Key is a required field.',
            'string.empty': 'Lawsuit Document Key cannot be empty.',
          }),
          originalFileName: Joi.string().required().messages({
            'any.required': 'Original File Name is a required field.',
            'string.empty': 'Original File Name cannot be empty.',
          }),
        })
      ),
      paymentType: Joi.string().allow('').messages({
        'string.base': 'Payment type must be a string.',
      }),
      paymentToken: Joi.string().allow('').messages({
        'string.base': 'Payment token must be a string.',
      }),
      extractedFields: Joi.array().allow(null).optional(),
      profitMargin: Joi.number().optional().messages({
        'number.base': 'Profit Margin must be a number.',
      }),
      basicInformation: Joi.object({
        fullName: Joi.string().required().messages({
          'any.required': 'Full Name is a required field.',
          'string.empty': 'Full Name cannot be empty.',
        }),
        email: Joi.string().email().required().messages({
          'any.required': 'Email is a required field.',
          'string.email': 'Email must be a valid email address.',
          'string.empty': 'Email cannot be empty.',
        }),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'SSID is a required field.',
            'string.pattern.base': 'SSID must be a 9-digit number.',
            'string.empty': 'SSID cannot be empty.',
          }),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
          'string.empty': 'State cannot be empty.',
        }),
        status: Joi.string().required().messages({
          'any.required': 'Status is a required field.',
          'string.empty': 'Status cannot be empty.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
          'string.empty': 'City cannot be empty.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
          'string.empty': 'Zip Code cannot be empty.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'any.required': 'Phone number is a required field.',
            'string.pattern.base': 'Phone number must be a 10-digit number.',
            'string.empty': 'Phone number cannot be empty.',
          }),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
          'string.empty': 'Address cannot be empty.',
        }),
        weeklyBudget: Joi.number().optional().messages({
          'number.base': 'Weekly Budget must be a number.',
        }),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required().messages({
          'any.required': 'Company Name is a required field.',
          'string.empty': 'Company Name cannot be empty.',
        }),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'any.required': 'EIN is a required field.',
            'string.pattern.base': 'EIN must be a 9-digit number.',
            'string.empty': 'EIN cannot be empty.',
          }),
        businessCategory: Joi.string().required().messages({
          'any.required': 'Business Category is a required field.',
          'string.empty': 'Business Category cannot be empty.',
        }),
        description: Joi.string().allow('').messages({
          'string.base': 'Description must be a string.',
        }),
        state: Joi.string().required().messages({
          'any.required': 'State is a required field.',
          'string.empty': 'State cannot be empty.',
        }),
        city: Joi.string().required().messages({
          'any.required': 'City is a required field.',
          'string.empty': 'City cannot be empty.',
        }),
        zipCode: Joi.string().required().messages({
          'any.required': 'Zip Code is a required field.',
          'string.empty': 'Zip Code cannot be empty.',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .messages({
            'string.pattern.base': 'Phone number must be a 10-digit number.',
            'string.empty': 'Phone cannot be empty.',
          }),
        address: Joi.string().required().messages({
          'any.required': 'Address is a required field.',
          'string.empty': 'Address cannot be empty.',
        }),
      }),
      contacts: Joi.array().items(
        Joi.object({
          name: Joi.string().required().messages({
            'any.required': 'Contact Name is a required field.',
            'string.empty': 'Contact Name cannot be empty.',
          }),
          title: Joi.string().required().messages({
            'any.required': 'Title is a required field.',
            'string.empty': 'Title cannot be empty.',
          }),
          phone: Joi.string()
            .pattern(/^\d{10}$/)
            .required()
            .messages({
              'any.required': 'Contact Phone number is a required field.',
              'string.pattern.base':
                'Contact Phone number must be a 10-digit number.',
              'string.empty': 'Contact Phone number cannot be empty.',
            }),
          email: Joi.string().email().allow('').messages({
            'string.email': 'Contact Email must be a valid email address.',
            'string.base': 'Contact Email must be a string.',
          }),
          relationWithDebtor: Joi.string().allow('').messages({
            'string.base': 'Relation with debtor must be a string.',
          }),
          state: Joi.string().allow('').messages({
            'string.base': 'State must be a string.',
          }),
          city: Joi.string().allow('').messages({
            'string.base': 'The target must be a string.',
          }),
          zipCode: Joi.string().allow('').messages({
            'string.empty': 'City cannot be empty.',
          }),
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
              'string.empty': 'Document key cannot be empty',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'any.required': 'Original file name is required',
              'string.empty': 'Original file name cannot be empty',
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
              'string.empty': 'MCA document key cannot be empty',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'MCA original file name must be a string',
              'any.required': 'MCA original file name is required',
              'string.empty': 'MCA original file name cannot be empty',
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
              'string.empty': 'Bank statement key cannot be empty',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base':
                'Bank statement original file name must be a string',
              'any.required': 'Bank statement original file name is required',
              'string.empty':
                'Bank statement original file name cannot be empty',
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
              'string.empty': 'Other document key cannot be empty',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base':
                'Other document original file name must be a string',
              'any.required': 'Other document original file name is required',
              'string.empty':
                'Other document original file name cannot be empty',
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
          'string.empty': 'Full name cannot be empty',
        }),
        email: Joi.string().email().required().messages({
          'string.email': 'Email must be a valid email address',
          'any.required': 'Email is required',
          'string.empty': 'Email cannot be empty',
        }),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'string.pattern.base': 'SSID must be a 9-digit number',
            'any.required': 'SSID is required',
            'string.empty': 'SSID cannot be empty',
          }),
        state: Joi.string().required().messages({
          'string.base': 'State must be a string',
          'any.required': 'State is required',
          'string.empty': 'State cannot be empty',
        }),
        status: Joi.string().required().messages({
          'string.base': 'Status must be a string',
          'any.required': 'Status is required',
          'string.empty': 'Status cannot be empty',
        }),
        city: Joi.string().required().messages({
          'string.base': 'City must be a string',
          'any.required': 'City is required',
          'string.empty': 'City cannot be empty',
        }),
        zipCode: Joi.string().required().messages({
          'string.base': 'Zip code must be a string',
          'any.required': 'Zip code is required',
          'string.empty': 'Zip code cannot be empty',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required()
          .messages({
            'string.pattern.base': 'Phone number must be a 10-digit number',
            'any.required': 'Phone number is required',
            'string.empty': 'Phone number cannot be empty',
          }),
        address: Joi.string().required().messages({
          'string.base': 'Address must be a string',
          'any.required': 'Address is required',
          'string.empty': 'Address cannot be empty',
        }),
        weeklyBudget: Joi.number().optional().messages({
          'number.base': 'Weekly budget must be a number',
        }),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required().messages({
          'string.base': 'Company name must be a string',
          'any.required': 'Company name is required',
          'string.empty': 'Company name cannot be empty',
        }),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required()
          .messages({
            'string.pattern.base': 'EIN must be a 9-digit number',
            'any.required': 'EIN is required',
            'string.empty': 'EIN cannot be empty',
          }),
        businessCategory: Joi.string().required().messages({
          'string.base': 'Business category must be a string',
          'any.required': 'Business category is required',
          'string.empty': 'Business category cannot be empty',
        }),
        description: Joi.string().allow('').messages({
          'string.base': 'Description must be a string',
        }),
        state: Joi.string().required().messages({
          'string.base': 'State must be a string',
          'any.required': 'State is required',
          'string.empty': 'State cannot be empty',
        }),
        city: Joi.string().required().messages({
          'string.base': 'City must be a string',
          'any.required': 'City is required',
          'string.empty': 'City cannot be empty',
        }),
        zipCode: Joi.string().required().messages({
          'string.base': 'Zip code must be a string',
          'any.required': 'Zip code is required',
          'string.empty': 'Zip code cannot be empty',
        }),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .messages({
            'string.pattern.base': 'Phone number must be a 10-digit number',
            'string.empty': 'Phone number cannot be empty',
          }),
        address: Joi.string().required().messages({
          'string.base': 'Address must be a string',
          'any.required': 'Address is required',
          'string.empty': 'Address cannot be empty',
        }),
      }),
      contacts: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required().messages({
              'string.base': 'Contact name must be a string',
              'any.required': 'Contact name is required',
              'string.empty': 'Contact name cannot be empty',
            }),
            title: Joi.string().required().messages({
              'string.base': 'Contact title must be a string',
              'any.required': 'Contact title is required',
              'string.empty': 'Contact title cannot be empty',
            }),
            phone: Joi.string()
              .pattern(/^\d{10}$/)
              .required()
              .messages({
                'string.pattern.base':
                  'Contact phone number must be a 10-digit number',
                'any.required': 'Contact phone number is required',
                'string.empty': 'Contact phone number cannot be empty',
              }),
            email: Joi.string().email().allow('').messages({
              'string.email': 'Contact email must be a valid email address',
              'string.base': 'Contact email must be a string value',
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

    const {error} = schema.validate(req.body);

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
              fullName: Joi.string().required().messages({
                'string.base': 'Full name must be a string',
                'any.required': 'Full name is required',
                'string.empty': 'Full name cannot be empty',
              }),
              email: Joi.string().email().required().messages({
                'string.email': 'Email must be a valid email address',
                'any.required': 'Email is required',
                'string.empty': 'Email cannot be empty',
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
              companyName: Joi.string().required().messages({
                'string.base': 'Company name must be a string',
                'string.empty': 'Company name cannot be empty',
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
                    'string.empty': 'Contact name cannot be empty',
                  }),
                  title: Joi.string().required().messages({
                    'string.base': 'Contact title must be a string',
                    'any.required': 'Contact title is required',
                    'string.empty': 'Contact title cannot be empty',
                  }),
                  phone: Joi.string().required().messages({
                    'string.base': 'Contact phone must be a string',
                    'any.required': 'Contact phone is required',
                    'string.empty': 'Contact phone cannot be empty',
                  }),
                  email: Joi.string().email().allow('').messages({
                    'string.email':
                      'Contact email must be a valid email address',
                    'string.base': 'Contact email must be a string',
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

    const {error} = schema.validate(req.body);

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
      paymentType: Joi.string().valid('cc', 'ck').required().messages({
        'string.base': 'Payment type must be a string',
        'any.required': 'Payment type is required',
        'string.empty': 'Payment type cannot be empty',
        'any.only': "Payment type must be either 'cc' or 'ck'",
      }),
      paymentToken: Joi.string().required().messages({
        'string.base': 'Payment token must be a string',
        'any.required': 'Payment token is required',
        'string.empty': 'Payment token cannot be empty',
      }),
      platform: Joi.string()
        .valid('Easypay direct', 'Seamlesschex merchant')
        .required()
        .messages({
          'string.base': 'Platform must be a string',
          'any.required': 'Platform is required',
          'any.only':
            "Platform must be either 'Easypay direct' or 'Seamlesschex merchant'",
          'string.empty': 'Platform cannot be empty',
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

  updateDebtorAccount = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      customerVaultId: Joi.string().required().messages({
        'string.base': 'Customer vault id must be a string',
        'any.required': 'Customer vault id is required',
        'string.empty': 'Customer vault id cannot be empty',
      }),
      paymentType: Joi.string().valid('cc', 'ck').required().messages({
        'string.base': 'Payment type must be a string',
        'any.required': 'Payment type is required',
        'string.empty': 'Payment type cannot be empty',
        'any.only': "Payment type must be either 'cc' or 'ck'",
      }),
      paymentToken: Joi.string().required().messages({
        'string.base': 'Payment token must be a string',
        'any.required': 'Payment token is required',
        'string.empty': 'Payment token cannot be empty',
      }),
      platform: Joi.string()
        .valid('Easypay direct', 'Seamlesschex merchant')
        .required()
        .messages({
          'string.base': 'Platform must be a string',
          'any.required': 'Platform is required',
          'any.only':
            "Platform must be either 'Easypay direct' or 'Seamlesschex merchant'",
          'string.empty': 'Platform cannot be empty',
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

  deleteDebtorAccountDebtorPortal = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      customerVaultId: Joi.string().required().messages({
        'string.base': 'Customer vault id must be a string',
        'any.required': 'Customer vault id is required',
        'string.empty': 'Customer vault id cannot be empty',
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

  saveWeeklyBudgetValues = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      strategy1Profit: Joi.number().strict().messages({
        'number.base': 'Strategy 1 profit must be a number',
        'string.empty': 'Strategy 1 profit cannot be empty',
      }),
      strategy1Weekly: Joi.number().strict().messages({
        'number.base': 'Strategy 1 weekly value must be a number',
        'string.empty': 'Strategy 1 weekly value cannot be empty',
      }),
      strategy1Custom: Joi.number().strict().messages({
        'number.base': 'Strategy 1 custom value must be a number',
        'string.empty': 'Strategy 1 custom value cannot be empty',
      }),
      strategy1Choosen: Joi.string().messages({
        'string.base': 'Strategy 1 chosen value must be a string',
        'string.empty': 'Strategy 1 chosen value cannot be empty',
      }),
      strategy3Profit: Joi.number().strict().messages({
        'number.base': 'Strategy 3 profit must be a number',
        'string.empty': 'Strategy 3 profit cannot be empty',
      }),
      strategy3ProfitMargin: Joi.number().strict().messages({
        'number.base': 'Strategy 3 profit margin must be a number',
        'string.empty': 'Strategy 3 profit margin cannot be empty',
      }),
      strategy3Custom: Joi.number().strict().messages({
        'number.base': 'Strategy 3 custom value must be a number',
        'string.empty': 'Strategy 3 custom value cannot be empty',
      }),
      strategy3Choosen: Joi.string().messages({
        'string.base': 'Strategy 3 chosen value must be a string',
        'string.empty': 'Strategy 3 chosen value cannot be empty',
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

  validateManualPayment = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      debtorId: Joi.string().required().messages({
        'string.base': 'Debtor ID must be a string',
        'string.empty': 'Debtor ID cannot be empty',
        'any.required': 'Debtor ID is required',
      }),
      transactionIds: Joi.array().items(Joi.string()).required().messages({
        'array.base': 'Transaction IDs must be an array',
        'string.base': 'Each Transaction ID must be a string',
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
          'string.empty': 'Transaction type cannot be empty',
          'any.required': 'Transaction type is required',
          'any.only':
            "Transaction type must be one of ['Wire', 'Check', 'Cash']",
        }),
      referenceId: Joi.string().required().messages({
        'string.base': 'Reference ID must be a string',
        'string.empty': 'Reference ID cannot be empty',
        'any.required': 'Reference ID is required',
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

  revertPayment = async (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      commission: Joi.number().required().messages({
        'number.base': 'Commission must be a number',
        'string.empty': 'Commission cannot be empty',
        'any.required': 'Commission is required',
      }),
      referenceId: Joi.string().required().messages({
        'string.base': 'Reference ID must be a string',
        'string.empty': 'Reference ID cannot be empty',
        'any.required': 'Reference ID is required',
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

  updateWeeklyBudget = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      weeklyBudget: Joi.number().strict().required().messages({
        'number.base': 'Weekly budget must be a number',
        'number.empty': 'Weekly budget cannot be empty',
        'any.required': 'Weekly budget is required',
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
              'string.empty': 'MCA document key cannot be empty',
              'any.required': 'MCA document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'string.empty': 'Original file name cannot be empty',
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
              'string.empty': 'Bank statement document key cannot be empty',
              'any.required': 'Bank statement document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'string.empty': 'Original file name cannot be empty',
              'any.required': 'Original file name is required',
            }),
          })
        )
        .optional()
        .messages({
          'array.base': 'Bank statement documents must be an array',
        }),

      lawsuitDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'Lawsuit document key must be a string',
              'string.empty': 'Lawsuit document key cannot be empty',
              'any.required': 'Lawsuit document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'string.empty': 'Original file name cannot be empty',
              'any.required': 'Original file name is required',
            }),
          })
        )
        .optional()
        .messages({
          'array.base': 'Lawsuit document documents must be an array',
        }),

      otherDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().messages({
              'string.base': 'Other document key must be a string',
              'string.empty': 'Other document key cannot be empty',
              'any.required': 'Other document key is required',
            }),
            originalFileName: Joi.string().required().messages({
              'string.base': 'Original file name must be a string',
              'string.empty': 'Original file name cannot be empty',
              'any.required': 'Original file name is required',
            }),
          })
        )
        .optional()
        .messages({
          'array.base': 'Other documents must be an array',
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

  syncDebtorEmail = async (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
      }),
      platform: Joi.string().required().messages({
        'string.base': 'Platform must be a string',
        'string.empty': 'Platform cannot be empty',
        'any.required': 'Platform is required',
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

  async getTopPayees(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      months: Joi.array()
        .items(
          Joi.string().messages({
            'string.base': 'Month must be a string.',
            'string.empty': 'Month cannot be an empty string.',
          })
        )
        .required()
        .messages({
          'any.required': 'Months array is required.',
          'array.base': 'Months must be an array.',
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

export default new DebtorRequests();
