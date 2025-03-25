"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class CaseValidate {
    // async validateCase(req: Request, res: Response, next: NextFunction) {
    //   const schema = Joi.object({
    //     // Example custom validation for the documents field
    //     // documents: Joi.array().items(
    //     //   Joi.object({
    //     //     key: Joi.string().required().messages({
    //     //       'string.base': 'Key should be a string',
    //     //       'any.required': 'Key is required'
    //     //     }),
    //     //     originalFileName: Joi.string().required().messages({
    //     //       'string.base': 'Original file name should be a string',
    //     //       'any.required': 'Original file name is required'
    //     //     }),
    //     //   }).optional()
    //     // ),
    //     // debtor: Joi.object({
    //     //   basicInformation: Joi.object({
    //     //     fullName: Joi.string().required().messages({
    //     //       'string.empty': 'Full name cannot be empty.',
    //     //       'string.base': 'Full name should be a string',
    //     //       'any.required': 'Full name is required',
    //     //     }),
    //     //     email: Joi.string().email().required().messages({
    //     //       'string.base': 'Email should be a string',
    //     //       'string.email': 'Email should be a valid email address',
    //     //       'any.required': 'Email is required',
    //     //     }),
    //     //     SSID: Joi.string()
    //     //       .pattern(/^\d{9}$/)
    //     //       .required()
    //     //       .messages({
    //     //         'string.base': 'SSID should be a string',
    //     //         'string.pattern.base': 'SSID should be a valid 9-digit number',
    //     //         'any.required': 'SSID is required',
    //     //       }),
    //     //     country: Joi.string().required().messages({
    //     //       'string.empty': 'Country cannot be empty.',
    //     //       'string.base': 'Country should be a string',
    //     //       'any.required': 'Country is required',
    //     //     }),
    //     //     state: Joi.string().required().messages({
    //     //       'string.empty': 'State cannot be empty.',
    //     //       'string.base': 'State should be a string',
    //     //       'any.required': 'State is required',
    //     //     }),
    //     //     status: Joi.string()
    //     //       .valid('Customer', 'On hold', 'Canceled', 'Declared Bankrupcy')
    //     //       .required()
    //     //       .messages({
    //     //         'string.base': 'Status should be a string',
    //     //         'any.required': 'Status is required',
    //     //         'any.only':
    //     //           'Status must be one of the following: Customer, On hold, Canceled, Declared Bankrupcy',
    //     //       }),
    //     //     city: Joi.string().required().messages({
    //     //       'string.empty': 'City cannot be empty.',
    //     //       'string.base': 'City should be a string',
    //     //       'any.required': 'City is required',
    //     //     }),
    //     //     zipCode: Joi.string().required().messages({
    //     //       'string.empty': 'Zip cannot be empty.',
    //     //       'string.base': 'Zip Code should be a string',
    //     //       'any.required': 'Zip Code is required',
    //     //     }),
    //     //     phone: Joi.string()
    //     //       .pattern(/^\+\d{11}$/)
    //     //       .required()
    //     //       .messages({
    //     //         'string.base': 'Phone should be a string',
    //     //         'string.pattern.base':
    //     //           'Phone should be a valid phone number (e.g., +12345678901)',
    //     //         'any.required': 'Phone is required',
    //     //       }),
    //     //     address: Joi.string().required().messages({
    //     //       'string.empty': 'Address cannot be empty.',
    //     //       'string.base': 'Address should be a string',
    //     //       'any.required': 'Address is required',
    //     //     }),
    //     //     weeklyBudget: Joi.number().messages({
    //     //       'number.base': 'Weekly budget should be a number',
    //     //     }),
    //     //   businessInformation: Joi.object({
    //     //     companyName: Joi.string().required(),
    //     //     EIN: Joi.string()
    //     //       .pattern(/^\d{9}$/)
    //     //       .required(),
    //     //     businessCategory: Joi.string().required(),
    //     //     description: Joi.string().allow(''),
    //     //     country: Joi.string().required(),
    //     //     state: Joi.string().required(),
    //     //     city: Joi.string().required(),
    //     //     zipCode: Joi.string().required(),
    //     //     phone: Joi.string()
    //     //       .pattern(/^\+\d{11}$/)
    //     //       .required(),
    //     //     address: Joi.string().required(),
    //     //   }),
    //     //   contacts: Joi.array().items(
    //     //     Joi.object({
    //     //       name: Joi.string().required(),
    //     //       title: Joi.string().required(),
    //     //       phone: Joi.string()
    //     //         .pattern(/^\+\d{11}$/)
    //     //         .required(),
    //     //       email: Joi.string().email().required(),
    //     //       relationWithDebtor: Joi.string().allow(''),
    //     //       country: Joi.string().allow(''),
    //     //       state: Joi.string().allow(''),
    //     //       city: Joi.string().allow(''),
    //     //       zipCode: Joi.string().allow(''),
    //     //     })
    //     //   ),
    //     // }),
    //     //   }),
    //     // }),
    //     creditor: Joi.object({
    //       basicInformation: Joi.object({
    //         fullName: Joi.string().required().messages({
    //           'string.empty': 'Full name cannot be empty.',
    //           'string.base': 'Full name should be a string',
    //           'any.required': 'Full name is required',
    //         }),
    //         email: Joi.string().email().required().messages({
    //           'string.base': 'Email should be a string',
    //           'string.email': 'Email should be a valid email address',
    //           'any.required': 'Email is required',
    //         }),
    //         phone: Joi.string()
    //           .pattern(/^\d{10}$/)
    //           .required()
    //           .messages({
    //             'string.base': 'Phone should be a string',
    //             'string.pattern.base': 'Phone should be a valid 10-digit number',
    //             'any.required': 'Phone is required',
    //           }),
    //       }),
    //       businessInformation: Joi.object({
    //         companyName: Joi.string().required().messages({
    //           'string.empty': 'Company cannot be empty.',
    //           'string.base': 'Company name should be a string',
    //           'any.required': 'Company name is required',
    //         }),
    //         businessCategory: Joi.string().required().messages({
    //           'string.empty': 'Bussiness category cannot be empty.',
    //           'string.base': 'Business category should be a string',
    //           'any.required': 'Business category is required',
    //         }),
    //       }),
    //       contacts: Joi.array()
    //         .items(
    //           Joi.object({
    //             name: Joi.string().required().messages({
    //               'string.base': 'Name must be a string.',
    //               'any.required': 'Name is required.',
    //               'string.empty': 'Name cannot be empty.',
    //             }),
    //             title: Joi.string().required().messages({
    //               'string.base': 'Title must be a string.',
    //               'any.required': 'Title is required.',
    //               'string.empty': 'Title cannot be empty.',
    //             }),
    //             phone: Joi.string()
    //               .pattern(/^\d{10}$/)
    //               .required()
    //               .messages({
    //                 'string.base': 'Phone number must be a string.',
    //                 'any.required': 'Phone number is required.',
    //                 'string.empty': 'Phone number cannot be empty.',
    //                 'string.pattern.base':
    //                   'Phone number must be exactly 10 digits.',
    //               }),
    //             email: Joi.string().email().required().messages({
    //               'string.base': 'Email must be a string.',
    //               'any.required': 'Email is required.',
    //               'string.empty': 'Email cannot be empty.',
    //               'string.email': 'Email must be a valid email address.',
    //             }),
    //             relationWithCreditor: Joi.string().allow('').messages({
    //               'string.base': 'Relation with creditor must be a string.',
    //             }),
    //             state: Joi.string().allow('').messages({
    //               'string.base': 'State must be a string.',
    //             }),
    //             city: Joi.string().allow('').messages({
    //               'string.base': 'City must be a string.',
    //             }),
    //             zipCode: Joi.string().allow('').messages({
    //               'string.base': 'Zip code must be a string.',
    //             }),
    //           })
    //         )
    //         .messages({
    //           'array.base': 'Contacts must be an array.',
    //           'array.includes': 'Each contact must be a valid object.',
    //         }),
    //       notes: Joi.string().allow('').messages({
    //         'string.base': 'Notes should be a string',
    //       }),
    //       creditorSecurityKey: Joi.string().allow('').messages({
    //         'string.base': 'Creditor security key should be a string',
    //       }),
    //       accountTitle: Joi.string().optional().allow('', null).messages({
    //         'string.base': 'Account title should be a string',
    //       }),
    //       lastFundedDate: Joi.date().optional().messages({
    //         'date.base': 'Last funded date should be a valid date',
    //       }),
    //       historicalRange: Joi.object({
    //         minimum: Joi.number().strict().optional().messages({
    //           'number.base': 'Minimum value should be a number',
    //         }),
    //         maximum: Joi.number().strict().optional().messages({
    //           'number.base': 'Maximum value should be a number',
    //         }),
    //       }),
    //     })
    //       .optional()
    //       .allow(null),
    //     totalDebt: Joi.number().strict().required().messages({
    //       'number.base': 'Total debt should be a number',
    //       'any.required': 'Total debt is required',
    //     }),
    //     lastPaymentDate: Joi.date().messages({
    //       'date.base': 'Last payment date should be a valid date',
    //     }),
    //     paidAmount: Joi.number().strict().required().messages({
    //       'number.empty': 'Paid amount cannot be empty',
    //       'number.base': 'Paid amount should be a number',
    //       'any.required': 'Paid amount is required',
    //     }),
    //     remaining: Joi.number().strict().required().messages({
    //       'number.empty': 'Remaining amount cannot be empty.',
    //       'number.base': 'Remaining amount should be a number',
    //       'any.required': 'Remaining amount is required',
    //     }),
    //     confidence: Joi.number().strict().messages({
    //       'number.base': 'Confidence should be a number',
    //     }),
    //     closeDate: Joi.date().messages({
    //       'date.base': 'Close date should be a valid date',
    //     }),
    //     paymentToken: Joi.string().allow('').messages({
    //       'string.base': 'Payment token should be a string',
    //     }),
    //     paymentType: Joi.string().valid('cc', 'ck').allow('').messages({
    //       'string.base': 'Payment type should be a string',
    //       'any.only': 'Payment type must be one of the following: cc, ck',
    //     }),
    //     status: Joi.string().required().messages({
    //       'string.empty': 'Status cannot be empty.',
    //       'string.base': 'Status should be a string',
    //       'any.required': 'Status is required',
    //     }),
    //     notes: Joi.string().messages({
    //       'string.base': 'Notes should be a string',
    //     }),
    //     chatId: Joi.string().messages({
    //       'string.base': 'Chat ID should be a string',
    //     }),
    //     feePayment: Joi.string()
    //       .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
    //       .messages({
    //         'string.base': 'Fee payment should be a string',
    //         'any.only':
    //           'Fee payment must be one of the following: paidViaCash, toPay, paidViaThirdParty',
    //       }),
    //     intervals: Joi.array()
    //       .items(
    //         Joi.object({
    //           amount: Joi.number().strict().required().messages({
    //             'number.empty': 'Amount cannot be empty',
    //             'number.base': 'Amount should be a number',
    //             'any.required': 'Amount is required',
    //           }),
    //           startDate: Joi.date().required().messages({
    //             'date.base': 'Start date should be a valid date',
    //             'any.required': 'Start date is required',
    //           }),
    //           frequency: Joi.number().optional().messages({
    //             'number.base': 'Frequency should be a number',
    //           }),
    //           timePeriod: Joi.string()
    //             .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
    //             .required()
    //             .messages({
    //               'string.base': 'Time period should be a string',
    //               'any.required': 'Time period is required',
    //               'any.only':
    //                 'Time period must be one of the following: Weekly, Monthly, Custom, Fortnightly, Daily',
    //             }),
    //         })
    //       )
    //       .optional(),
    //   });
    //   // Handling bulk case validation
    //   if (req.query.bulk === 'true') {
    //     const cases = req.body.cases;
    //     if (Array.isArray(cases)) {
    //       for (const tempCase of cases) {
    //         const {error} = schema.validate(tempCase);
    //         if (error) {
    //           return res
    //             .status(constants.CODE.BAD_REQUEST)
    //             .send(responseHelper.get4xxResponse(error.details[0].message));
    //         }
    //       }
    //     } else {
    //       return res
    //         .status(constants.CODE.BAD_REQUEST)
    //         .send(responseHelper.get4xxResponse('Please provide cases array'));
    //     }
    //     return next();
    //   }
    //   const {error} = schema.validate(req.body);
    //   if (!error) {
    //     return next();
    //   } else {
    //     return res
    //       .status(constants.CODE.BAD_REQUEST)
    //       .send(responseHelper.get4xxResponse(error.details[0].message));
    //   }
    // }
    async validateCaseAbout(req, res, next) {
        const schema = joi_1.default.object({
            status: joi_1.default.string().required().messages({
                'string.base': 'status must be a string',
                'string.empty': 'status cannot be empty',
                'any.required': 'status is required',
            }),
            caseOwner: joi_1.default.string().required().messages({
                'string.base': 'caseOwner must be a string',
                'string.empty': 'caseOwner cannot be empty',
                'any.required': 'caseOwner is required',
            }),
            negotiator: joi_1.default.string().required().messages({
                'string.base': 'negotiator must be a string',
                'string.empty': 'negotiator cannot be empty',
                'any.required': 'negotiator is required',
            }),
            manager: joi_1.default.string().required().messages({
                'string.base': 'manager must be a string',
                'string.empty': 'manager cannot be empty',
                'any.required': 'manager is required',
            }),
            caseOwnerId: joi_1.default.string().required().messages({
                'string.base': 'caseOwnerId must be a string',
                'string.empty': 'caseOwnerId cannot be empty',
                'any.required': 'caseOwnerId is required',
            }),
            negotiatorId: joi_1.default.string().required().messages({
                'string.base': 'negotiatorId must be a string',
                'string.empty': 'negotiatorId cannot be empty',
                'any.required': 'negotiatorId is required',
            }),
            managerId: joi_1.default.string().required().messages({
                'string.base': 'managerId must be a string',
                'string.empty': 'managerId cannot be empty',
                'any.required': 'managerId is required',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async updateCase(req, res, next) {
        const schema = joi_1.default.object({
            caseOwner: joi_1.default.string().optional().messages({
                'any.required': 'Case Owner is required.',
                'string.pattern.base': 'Case Owner is invalid.',
                'string.empty': 'Case Owner cannot be empty.',
            }),
            creditor: joi_1.default.object({
                aggression: joi_1.default.number().optional().min(0).max(10).messages({
                    'number.base': 'Aggression must be a number.',
                    'number.min': 'Aggression must be greater than or equal to 0.',
                    'number.max': 'Aggression must be less than or equal to 10.',
                }),
                _id: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Creditor ID must be a string.',
                }),
                paymentType: joi_1.default.string().allow('').messages({
                    'string.base': 'Payment type must be a string.',
                }),
                paymentToken: joi_1.default.string().allow('').messages({
                    'string.base': 'Payment token must be a string.',
                }),
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required().messages({
                        'string.base': 'Full name must be a string.',
                        'string.empty': 'Full name is required and cannot be empty.',
                        'any.required': 'Full name is a required field.',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'string.base': 'Email must be a string.',
                        'string.empty': 'Email is required and cannot be empty.',
                        'string.email': 'Email must be a valid email address.',
                        'any.required': 'Email is a required field.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'string.base': 'Phone must be a string.',
                        'string.empty': 'Phone is required and cannot be empty.',
                        'string.pattern.base': 'Phone must be a 10-digit number.',
                        'any.required': 'Phone is a required field.',
                    }),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required().messages({
                        'string.base': 'Company name must be a string.',
                        'string.empty': 'Company name is required and cannot be empty.',
                        'any.required': 'Company name is a required field.',
                    }),
                    businessCategory: joi_1.default.string().allow('').messages({
                        'string.base': 'Business category must be a string.',
                    }),
                }),
                contacts: joi_1.default.array()
                    .items(joi_1.default.object({
                    name: joi_1.default.string().required().messages({
                        'string.base': 'Name must be a string.',
                        'string.empty': 'Name is required and cannot be empty.',
                        'any.required': 'Name is a required field.',
                    }),
                    title: joi_1.default.string().required().messages({
                        'string.base': 'Title must be a string.',
                        'string.empty': 'Title is required and cannot be empty.',
                        'any.required': 'Title is a required field.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'string.base': 'Phone must be a string.',
                        'string.empty': 'Phone is required and cannot be empty.',
                        'string.pattern.base': 'Phone must be a valid 10-digit number.',
                        'any.required': 'Phone is a required field.',
                    }),
                    email: joi_1.default.string().email().allow('').messages({
                        'string.base': 'Email must be a string.',
                        'string.email': 'Email must be a valid email address.',
                    }),
                    relationWithCreditor: joi_1.default.string().allow('').messages({
                        'string.base': 'Relation with creditor must be a string.',
                    }),
                    state: joi_1.default.string().allow('').messages({
                        'string.base': 'State must be a string.',
                    }),
                    city: joi_1.default.string().allow('').messages({
                        'string.base': 'City must be a string.',
                    }),
                    zipCode: joi_1.default.string().allow('').messages({
                        'string.base': 'Zip code must be a string.',
                    }),
                    _id: joi_1.default.string().optional().messages({
                        'string.base': 'Contact ID must be a string.',
                    }),
                }))
                    .optional()
                    .messages({
                    'array.base': 'Contacts must be an array.',
                    'array.includes': 'Each contact must be a valid object with required fields.',
                }),
                notes: joi_1.default.string().allow('').messages({
                    'string.base': 'Notes must be a string.',
                }),
                creditorSecurityKey: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Creditor security key must be a string.',
                }),
                paynoteSourceId: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Paynote source ID must be a string.',
                }),
                paynoteUserId: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Paynote user ID must be a string.',
                }),
                accountTitle: joi_1.default.string().optional().allow('', null).messages({
                    'string.base': 'Account title must be a string.',
                }),
                lastFundedDate: joi_1.default.date().optional().allow('').messages({
                    'date.base': 'Last funded date must be a valid date.',
                }),
                historicalRange: joi_1.default.object({
                    minimum: joi_1.default.number().strict().optional().messages({
                        'number.base': 'Minimum must be a number.',
                    }),
                    maximum: joi_1.default.number().strict().optional().messages({
                        'number.base': 'Maximum must be a number.',
                    }),
                }),
            })
                .optional()
                .allow(null),
            totalDebt: joi_1.default.number().strict().optional().messages({
                'number.base': 'Total debt must be a number.',
            }),
            lastPaymentDate: joi_1.default.date().optional().allow('').messages({
                'date.base': 'Last payment date must be a valid date.',
            }),
            paidAmount: joi_1.default.number().strict().optional().messages({
                'number.base': 'Paid amount must be a number.',
            }),
            commission: joi_1.default.number().strict().allow(0).messages({
                'number.base': 'Commission must be a number.',
            }),
            totalCommission: joi_1.default.number().strict().allow(0).messages({
                'number.base': 'Total commission must be a number.',
            }),
            remaining: joi_1.default.number().strict().optional().messages({
                'number.base': 'Remaining must be a number.',
            }),
            confidence: joi_1.default.number().strict().messages({
                'number.base': 'Confidence must be a number.',
            }),
            isExempt: joi_1.default.boolean().optional().messages({
                'boolean.base': 'Is exempt must be a boolean.',
            }),
            contractDetails: joi_1.default.object().optional().allow(null),
            closeDate: joi_1.default.date().messages({
                'date.base': 'Close date must be a valid date.',
            }),
            status: joi_1.default.string().optional().messages({
                'string.base': 'Status must be a string.',
            }),
            notes: joi_1.default.string().messages({
                'string.base': 'Notes must be a string.',
            }),
            chatId: joi_1.default.string().messages({
                'string.base': 'Chat ID must be a string.',
            }),
            feePayment: joi_1.default.string()
                .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                .optional()
                .allow('')
                .messages({
                'string.base': 'Fee payment must be a string.',
                'any.only': 'Fee payment must be one of the valid options: paidViaCash, toPay, or paidViaThirdParty.',
            }),
            intervals: joi_1.default.array()
                .items(joi_1.default.object({
                amount: joi_1.default.number().strict().required().messages({
                    'number.base': 'Interval amount must be a number.',
                    'any.required': 'Interval amount is a required field.',
                }),
                startDate: joi_1.default.date().required().messages({
                    'date.base': 'Start date must be a valid date.',
                    'any.required': 'Start date is a required field.',
                }),
                frequency: joi_1.default.number().strict().optional().messages({
                    'number.base': 'Frequency must be a number.',
                }),
                timePeriod: joi_1.default.string()
                    .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                    .required()
                    .messages({
                    'string.base': 'Time period must be a string.',
                    'any.only': 'Time period must be one of the valid options: Weekly, Monthly, Custom, Fortnightly, or Daily.',
                    'any.required': 'Time period is a required field.',
                }),
            }))
                .optional()
                .messages({
                'array.base': 'Intervals must be an array.',
            }),
            lawsuitExist: joi_1.default.boolean().required().messages({
                'boolean.base': 'Lawsuit Exist must be a boolean value.',
                'any.required': 'Lawsuit Exist is a required field.',
            }),
            lawsuit: joi_1.default.object({
                balance: joi_1.default.number().required().messages({
                    'number.base': 'Balance must be a number.',
                    'any.required': 'Balance is a required field.',
                    'string.empty': 'Balance cannot be empty',
                }),
                document_date: joi_1.default.date().required().messages({
                    'date.base': 'Document date must be a valid date.',
                    'date.format': 'Document date must be in ISO format (YYYY-MM-DD).',
                    'any.required': 'Document date is a required field.',
                    'string.empty': 'Document date cannot be empty',
                }),
            })
                .optional()
                .messages({
                'object.base': 'Lawsuit must be an object.',
            }),
            lawfirm: joi_1.default.object({
                lawfirmCompanyName: joi_1.default.string().required().messages({
                    'string.base': 'Lawfirm company name must be a string.',
                    'any.required': 'Lawfirm company name is a required field.',
                    'string.empty': 'Lawfirm company cannot be empty',
                }),
                email: joi_1.default.string().email().required().messages({
                    'string.base': 'Lawfirm Email must be a string.',
                    'string.email': 'Lawfirm Email must be a valid email address.',
                    'any.required': 'Lawfirm Email is a required field.',
                    'string.empty': 'Lawfirm Email cannot be empty',
                }),
                phone: joi_1.default.string().required().messages({
                    'string.base': 'lawfirm PhoneNo must be a string.',
                    // 'string.pattern.base':
                    //   'lawfirm PhoneNo must must be between 10 digits.',
                    'any.required': 'lawfirm PhoneNo is a required field.',
                }),
                address: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'lawfirm Address must be a string.',
                    'any.required': 'lawfirm Address is a required field.',
                }),
                city: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'lawfirm City must be a string.',
                    'any.required': 'lawfirm City is a required field.',
                }),
                state: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'lawfirm State must be a string.',
                    'any.required': 'lawfirm State is a required field.',
                }),
                EIN: joi_1.default.string().pattern(/^\d+$/).optional().allow('').messages({
                    'string.base': 'lawfirm EIN must be a string.',
                    'string.pattern.base': 'lawfirm EIN must contain only digits.',
                    'any.required': 'lawfirm EIN is a required field.',
                }),
            })
                .optional()
                .messages({
                'object.base': 'Lawfirm must be an object.',
            }),
            attorney: joi_1.default.object({
                attorney_name: joi_1.default.string().required().messages({
                    'string.base': 'Attorney name must be a string.',
                    'any.required': 'Attorney name is a required field.',
                    'string.empty': 'Attorney name cannot be empty',
                }),
                attorney_telephone: joi_1.default.string().required().messages({
                    'string.base': 'Attorney PhoneNo must be a string of numbers.',
                    // 'string.pattern.base': 'Attorney PhoneNo must be between 10 digits.',
                    'any.required': 'Attorney PhoneNo is a required field.',
                    'string.empty': 'Attorney PhoneNo cannot be empty',
                }),
                attorney_address: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Attorney address must be a string.',
                    'any.required': 'Attorney address is a required field.',
                }),
                attorney_city: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Attorney city must be a string.',
                    'any.required': 'Attorney city is a required field.',
                }),
                attorney_SSN: joi_1.default.string()
                    .pattern(/^[0-9]{8,11}$/)
                    .optional()
                    .allow('')
                    .messages({
                    'string.base': 'Attorney SSN must be a string of numbers.',
                    'string.pattern.base': 'Attorney SSN must be between 8 to 11 digits.',
                }),
                attorney_state: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Attorney state must be a string.',
                    'string.length': 'Attorney state must be a 2-letter abbreviation (e.g., NY).',
                    'any.required': 'Attorney state is a required field.',
                }),
            })
                .optional()
                .messages({
                'object.base': 'Attorney must be an object.',
            }),
            // Lawsuit fields
            paymentFrequency: joi_1.default.string().optional().allow('').messages({
                'string.base': 'Payment frequency must be a string.',
            }),
            impliedInterestRate: joi_1.default.number().strict().optional().messages({
                'number.base': 'Implied interest rate must be a number.',
            }),
            averageInterestRate: joi_1.default.number().strict().optional().messages({
                'number.base': 'Average interest rate must be a number.',
            }),
            lawsuitFile: joi_1.default.array()
                .items(joi_1.default.object({
                key: joi_1.default.string().required().messages({
                    'string.base': 'File key must be a string.',
                    'any.required': 'File key is a required field.',
                }),
                originalFileName: joi_1.default.string().required().messages({
                    'string.base': 'Original file name must be a string.',
                    'any.required': 'Original file name is a required field.',
                }),
                url: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'File URL must be a string.',
                }),
            }))
                .optional()
                .messages({
                'array.base': 'Lawsuit files must be an array.',
            }),
            hasLawsuits: joi_1.default.boolean().optional().messages({
                'boolean.base': 'Has lawsuits must be a boolean.',
            }),
            lawsuitCreditorTags: joi_1.default.array()
                .items(joi_1.default.string().messages({
                'string.base': 'Each lawsuit creditor tag must be a string.',
            }))
                .optional()
                .messages({
                'array.base': 'Lawsuit creditor tags must be an array.',
            }),
            dateServed: joi_1.default.date().optional().messages({
                'date.base': 'Date served must be a valid date.',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async validateCreditorsCases(req, res, next) {
        const schema = joi_1.default.object({
            data: joi_1.default.array().items(joi_1.default.object({
                creditor: joi_1.default.object({
                    aggression: joi_1.default.number().optional().min(0).max(10).messages({
                        'number.base': 'Aggression must be a number.',
                        'number.min': 'Aggression must be at least 0.',
                        'number.max': 'Aggression must be at most 10.',
                    }),
                    paymentType: joi_1.default.string().allow('').messages({
                        'string.base': 'Payment type must be a string.',
                    }),
                    paymentToken: joi_1.default.string().allow('').messages({
                        'string.base': 'Payment token must be a string.',
                    }),
                    basicInformation: joi_1.default.object({
                        fullName: joi_1.default.string().required().messages({
                            'string.base': 'Full name must be a string.',
                            'string.empty': 'Full name cannot be empty.',
                            'any.required': 'Full name is required.',
                        }),
                        email: joi_1.default.string().email().required().messages({
                            'string.base': 'Email must be a string.',
                            'string.empty': 'Email cannot be empty.',
                            'string.email': 'Email must be a valid email address.',
                            'any.required': 'Email is required.',
                        }),
                        phone: joi_1.default.string()
                            .pattern(/^\d{10}$/)
                            .required()
                            .messages({
                            'string.base': 'Phone number must be a string.',
                            'string.empty': 'Phone number cannot be empty.',
                            'string.pattern.base': 'Phone number must be exactly 10 digits.',
                            'any.required': 'Phone number is required.',
                        }),
                    }),
                    businessInformation: joi_1.default.object({
                        companyName: joi_1.default.string().required().messages({
                            'string.base': 'Company name must be a string.',
                            'string.empty': 'Company name cannot be empty.',
                            'any.required': 'Company name is required.',
                        }),
                        businessCategory: joi_1.default.string().allow('').messages({
                            'string.base': 'Business category must be a string.',
                        }),
                    }),
                    contacts: joi_1.default.array().items(joi_1.default.object({
                        name: joi_1.default.string().required().messages({
                            'string.base': 'Contact name must be a string.',
                            'string.empty': 'Contact name cannot be empty.',
                            'any.required': 'Contact name is required.',
                        }),
                        title: joi_1.default.string().required().messages({
                            'string.base': 'Title must be a string.',
                            'string.empty': 'Title cannot be empty.',
                            'any.required': 'Title is required.',
                        }),
                        phone: joi_1.default.string()
                            .pattern(/^\d{10}$/)
                            .required()
                            .messages({
                            'string.base': 'Phone number must be a string.',
                            'string.empty': 'Phone number cannot be empty.',
                            'string.pattern.base': 'Phone number must be exactly 10 digits.',
                            'any.required': 'Phone number is required.',
                        }),
                        email: joi_1.default.string().email().allow('').messages({
                            'string.base': 'Email must be a string.',
                            'string.email': 'Email must be a valid email address.',
                        }),
                        relationWithCreditor: joi_1.default.string().allow('').messages({
                            'string.base': 'Relation with creditor must be a string.',
                        }),
                        state: joi_1.default.string().allow('').messages({
                            'string.base': 'State must be a string.',
                        }),
                        city: joi_1.default.string().allow('').messages({
                            'string.base': 'City must be a string.',
                        }),
                        zipCode: joi_1.default.string().allow('').messages({
                            'string.base': 'Zip code must be a string.',
                        }),
                    })),
                    notes: joi_1.default.string().allow('').messages({
                        'string.base': 'Notes must be a string.',
                    }),
                    paynoteSourceId: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Paynote source ID must be a string.',
                    }),
                    paynoteUserId: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Paynote user ID must be a string.',
                    }),
                    creditorSecurityKey: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Creditor security key must be a string.',
                    }),
                    accountTitle: joi_1.default.string().optional().allow('', null).messages({
                        'string.base': 'Account title must be a string.',
                    }),
                    lastFundedDate: joi_1.default.date().optional().allow('').messages({
                        'date.base': 'Last funded date must be a valid date.',
                    }),
                    historicalRange: joi_1.default.object({
                        minimum: joi_1.default.number().strict().optional().messages({
                            'number.base': 'Minimum range must be a number.',
                        }),
                        maximum: joi_1.default.number().strict().optional().messages({
                            'number.base': 'Maximum range must be a number.',
                        }),
                    }),
                }).allow(null),
                totalDebt: joi_1.default.number().strict().optional().messages({
                    'number.base': 'Total debt must be a number.',
                }),
                lastPaymentDate: joi_1.default.date().optional().allow('').messages({
                    'date.base': 'Last payment date must be a valid date.',
                }),
                paidAmount: joi_1.default.number().strict().optional().messages({
                    'number.base': 'Paid amount must be a number.',
                }),
                remaining: joi_1.default.number().strict().optional().messages({
                    'number.base': 'Remaining amount must be a number.',
                }),
                confidence: joi_1.default.number().strict().messages({
                    'number.base': 'Confidence must be a number.',
                }),
                isExempt: joi_1.default.boolean().optional().messages({
                    'boolean.base': 'Is exempt must be a boolean.',
                }),
                contractDetails: joi_1.default.object().optional().allow(null).messages({
                    'object.base': 'Contract details must be an object.',
                }),
                closeDate: joi_1.default.date().messages({
                    'date.base': 'Close date must be a valid date.',
                }),
                status: joi_1.default.string().optional().messages({
                    'string.base': 'Status must be a string.',
                }),
                notes: joi_1.default.string().messages({
                    'string.base': 'Notes must be a string.',
                    'any.required': 'Notes are required.',
                }),
                chatId: joi_1.default.string().messages({
                    'string.base': 'Chat ID must be a string.',
                    'string.empty': 'Chat ID cannot be empty.',
                    'any.required': 'Chat ID is required.',
                }),
                commisionPercentage: joi_1.default.number().strict().messages({
                    'number.base': 'Commission percentage must be a number.',
                    'any.required': 'Commission percentage is required.',
                }),
                feePayment: joi_1.default.string()
                    .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                    .optional()
                    .allow('')
                    .messages({
                    'string.base': 'Fee payment type must be a string.',
                }),
                intervals: joi_1.default.array()
                    .items(joi_1.default.object({
                    amount: joi_1.default.number().strict().required().messages({
                        'number.base': 'Amount must be a number.',
                        'any.required': 'Amount is required.',
                    }),
                    startDate: joi_1.default.date().required().messages({
                        'date.base': 'Start date must be a valid date.',
                        'any.required': 'Start date is required.',
                    }),
                    frequency: joi_1.default.number().optional().messages({
                        'number.base': 'Frequency must be a number.',
                    }),
                    timePeriod: joi_1.default.string()
                        .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                        .required()
                        .messages({
                        'string.base': 'Time period must be a string.',
                        'any.required': 'Time period is required.',
                    }),
                }))
                    .optional()
                    .messages({
                    'array.base': 'Intervals must be an array.',
                }),
                paymentFrequency: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Payment frequency must be a string.',
                }),
                impliedInterestRate: joi_1.default.number().strict().optional().messages({
                    'number.base': 'Implied interest rate must be a number.',
                }),
                averageInterestRate: joi_1.default.number().strict().optional().messages({
                    'number.base': 'Average interest rate must be a number.',
                }),
                lawsuitExist: joi_1.default.boolean().required().messages({
                    'boolean.base': 'Lawsuit Exist must be a boolean value.',
                    'any.required': 'Lawsuit Exist is a required field.',
                }),
                lawsuit: joi_1.default.object({
                    balance: joi_1.default.number().required().messages({
                        'number.base': 'Balance must be a number.',
                        'any.required': 'Balance is a required field.',
                        'string.empty': 'Balance cannot be empty',
                    }),
                    document_date: joi_1.default.date().required().messages({
                        'date.base': 'Document date must be a valid date.',
                        'date.format': 'Document date must be in ISO format (YYYY-MM-DD).',
                        'any.required': 'Document date is a required field.',
                        'string.empty': 'Document date cannot be empty',
                    }),
                })
                    .optional()
                    .messages({
                    'object.base': 'Lawsuit must be an object.',
                }),
                lawfirm: joi_1.default.object({
                    lawfirmCompanyName: joi_1.default.string().required().messages({
                        'string.base': 'Lawfirm company name must be a string.',
                        'any.required': 'Lawfirm company name is a required field.',
                        'string.empty': 'Lawfirm company cannot be empty',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'string.base': 'Lawfirm Email must be a string.',
                        'string.email': 'Lawfirm Email must be a valid email address.',
                        'any.required': 'Lawfirm Email is a required field.',
                        'string.empty': 'Lawfirm Email cannot be empty',
                    }),
                    phone: joi_1.default.string()
                        // .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'string.base': 'lawfirm PhoneNo must be a string.',
                        // 'string.pattern.base':
                        //   'lawfirm PhoneNo must must be between 10 digits.',
                        'any.required': 'lawfirm PhoneNo is a required field.',
                    }),
                    address: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'lawfirm Address must be a string.',
                        'any.required': 'lawfirm Address is a required field.',
                    }),
                    city: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'lawfirm City must be a string.',
                        'any.required': 'lawfirm City is a required field.',
                    }),
                    state: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'lawfirm State must be a string.',
                        'any.required': 'lawfirm State is a required field.',
                    }),
                    EIN: joi_1.default.string().pattern(/^\d+$/).optional().allow('').messages({
                        'string.base': 'lawfirm EIN must be a string.',
                        'string.pattern.base': 'lawfirm EIN must contain only digits.',
                        'any.required': 'lawfirm EIN is a required field.',
                    }),
                })
                    .optional()
                    .messages({
                    'object.base': 'Lawfirm must be an object.',
                }),
                attorney: joi_1.default.object({
                    attorney_name: joi_1.default.string().required().messages({
                        'string.base': 'Attorney name must be a string.',
                        'any.required': 'Attorney name is a required field.',
                        'string.empty': 'Attorney name cannot be empty',
                    }),
                    attorney_telephone: joi_1.default.string()
                        // .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'string.base': 'Attorney PhoneNo must be a string of numbers.',
                        // 'string.pattern.base':
                        //   'Attorney PhoneNo must be between 10 digits.',
                        'any.required': 'Attorney PhoneNo is a required field.',
                        'string.empty': 'Attorney PhoneNo cannot be empty',
                    }),
                    attorney_address: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Attorney address must be a string.',
                        'any.required': 'Attorney address is a required field.',
                    }),
                    attorney_city: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Attorney city must be a string.',
                        'any.required': 'Attorney city is a required field.',
                    }),
                    attorney_SSN: joi_1.default.string()
                        .pattern(/^[0-9]{8,11}$/)
                        .optional()
                        .allow('')
                        .messages({
                        'string.base': 'Attorney SSN must be a string of numbers.',
                        'string.pattern.base': 'Attorney SSN must be between 8 to 11 digits.',
                    }),
                    attorney_state: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Attorney state must be a string.',
                        'string.length': 'Attorney state must be a 2-letter abbreviation (e.g., NY).',
                        'any.required': 'Attorney state is a required field.',
                    }),
                })
                    .optional()
                    .messages({
                    'object.base': 'Attorney must be an object.',
                }),
            })),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async validateAddNotes(req, res, next) {
        const schema = joi_1.default.object({
            notes: joi_1.default.string().required().messages({
                'string.empty': 'Notes cannot be empty',
                'any.required': 'Notes is a required field',
                'string.base': 'Notes must be a string',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async sendEmail(req, res, next) {
        const schema = joi_1.default.object({
            sendTo: joi_1.default.string().email().required().messages({
                'string.empty': 'SendTo cannot be empty',
                'any.required': 'SendTo is a required field',
                'string.base': 'SendTo must be a string',
                'string.email': 'SendTo must be a valid email',
            }),
            from: joi_1.default.string().email().required().messages({
                'string.empty': 'From cannot be empty',
                'any.required': 'From is a required field',
                'string.base': 'From must be a string',
                'string.email': 'From must be a valid email',
            }),
            content: joi_1.default.string().required().messages({
                'string.empty': 'Content cannot be empty',
                'any.required': 'Content is a required field',
                'string.base': 'Content must be a string',
            }),
            subject: joi_1.default.string().required().messages({
                'string.empty': 'Subject cannot be empty',
                'any.required': 'Subject is a required field',
                'string.base': 'Subject must be a string',
            }),
            cc: joi_1.default.array().items(joi_1.default.string().email()).optional().messages({
                'array.base': 'CC must be an array of email addresses',
                'string.email': 'CC must contain valid email addresses',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async sendSmsEmailDebtorCreditor(req, res, next) {
        const type = String(req.query.type);
        let object = joi_1.default.object({
            sendTo: joi_1.default.string().email().required().messages({
                'string.empty': 'SendTo cannot be empty',
                'any.required': 'SendTo is a required field',
                'string.base': 'SendTo must be a string',
                'string.email': 'SendTo must be a valid email',
            }),
            from: joi_1.default.string().email().required().messages({
                'string.empty': 'From cannot be empty',
                'any.required': 'From is a required field',
                'string.base': 'From must be a string',
                'string.email': 'From must be a valid email',
            }),
            content: joi_1.default.string().required().messages({
                'string.empty': 'Content cannot be empty',
                'any.required': 'Content is a required field',
                'string.base': 'Content must be a string',
            }),
            subject: joi_1.default.string().required().messages({
                'string.empty': 'Subject cannot be empty',
                'any.required': 'Subject is a required field',
                'string.base': 'Subject must be a string',
            }),
            cc: joi_1.default.string()
                .required()
                .messages({
                'string.empty': 'CC cannot be empty',
                'string.base': 'CC must be a string',
            })
                .optional(),
            files: joi_1.default.string().optional().messages({
                'string.base': 'Files must be a string',
            }),
            signedUrls: joi_1.default.string().optional().messages({
                'string.base': 'SignedUrls must be a string',
            }),
        });
        if (req.body?.cc && typeof req.body?.cc === 'string') {
            try {
                if (!Array.isArray(JSON.parse(req.body.cc))) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('cc is invalid'));
                }
            }
            catch (err) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse('cc format is incorrect'));
            }
        }
        if (req.body?.signedUrls && typeof req.body?.signedUrls === 'string') {
            try {
                if (!Array.isArray(JSON.parse(req.body.signedUrls))) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('signedUrls is invalid'));
                }
            }
            catch (err) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse('signedUrls format is incorrect'));
            }
        }
        if (type === 'sms') {
            object = joi_1.default.object({
                sendTo: joi_1.default.string()
                    .pattern(/^\d{10}$/)
                    .required()
                    .messages({
                    'string.empty': 'SendTo cannot be empty',
                    'any.required': 'SendTo is a required field',
                    'string.base': 'SendTo must be a string',
                    'string.pattern.base': 'SendTo must be a valid 10-digit phone number',
                }),
                content: joi_1.default.string().required().messages({
                    'string.empty': 'Content cannot be empty',
                    'any.required': 'Content is a required field',
                    'string.base': 'Content must be a string',
                }),
                subject: joi_1.default.string().optional().messages({
                    'string.base': 'Subject must be a string',
                }),
                from: joi_1.default.string()
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
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async saveJustification(req, res, next) {
        const schema = joi_1.default.object({
            gemini: joi_1.default.boolean().required().messages({
                'any.required': 'Gemini field is required',
                'boolean.base': 'Gemini must be a boolean value',
            }),
            llama: joi_1.default.boolean().required().messages({
                'any.required': 'Llama field is required',
                'boolean.base': 'Llama must be a boolean value',
            }),
            chatgpt: joi_1.default.boolean().required().messages({
                'any.required': 'ChatGPT field is required',
                'boolean.base': 'ChatGPT must be a boolean value',
            }),
            claude: joi_1.default.boolean().required().messages({
                'any.required': 'Claude field is required',
                'boolean.base': 'Claude must be a boolean value',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async updateContractDetails(req, res, next) {
        const schema = joi_1.default.object({
            label: joi_1.default.string().required().messages({
                'any.required': 'Label field is required',
                'string.base': 'Label must be a string',
                'string.empty': 'Label cannot be empty',
            }),
            value: joi_1.default.string().required().messages({
                'any.required': 'Value field is required',
                'string.base': 'Value must be a string',
                'string.empty': 'Value cannot be empty',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async updateCasePlan(req, res, next) {
        const schema = joi_1.default.object({
            commission: joi_1.default.number().strict().allow(0).optional().messages({
                'number.base': 'Commission must be a valid number',
                'number.strict': 'Commission must be a strict number type',
            }),
            isExempt: joi_1.default.boolean().optional().messages({
                'boolean.base': 'Exempt field must be a boolean value',
            }),
            feePayment: joi_1.default.string()
                .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                .optional()
                .allow('')
                .messages({
                'string.base': 'FeePayment must be a string',
                'any.only': 'FeePayment must be one of the following: paidViaCash, toPay, paidViaThirdParty',
            }),
            intervals: joi_1.default.array()
                .items(joi_1.default.object({
                amount: joi_1.default.number().strict().required().messages({
                    'any.required': 'Amount is required',
                    'number.base': 'Amount must be a valid number',
                }),
                startDate: joi_1.default.date().required().messages({
                    'any.required': 'Start date is required',
                    'date.base': 'Start date must be a valid date',
                }),
                frequency: joi_1.default.number().optional().messages({
                    'number.base': 'Frequency must be a valid number',
                }),
                timePeriod: joi_1.default.string()
                    .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                    .required()
                    .messages({
                    'any.required': 'Time period is required',
                    'string.base': 'Time period must be a string',
                    'string.empty': 'Time period cannot be empty',
                    'any.only': 'Time period must be one of the following: Weekly, Monthly, Custom, Fortnightly, Daily',
                }),
            }))
                .optional()
                .messages({
                'array.base': 'Intervals must be an array',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async updateCasePlan1(req, res, next) {
        const schema = joi_1.default.object({
            intervals: joi_1.default.array()
                .items(joi_1.default.object({
                amount: joi_1.default.number().strict().required().messages({
                    'any.required': 'Amount is required',
                    'number.base': 'Amount must be a valid number',
                }),
                startDate: joi_1.default.date().required().messages({
                    'any.required': 'Start date is required',
                    'date.base': 'Start date must be a valid date',
                }),
                frequency: joi_1.default.number().optional().messages({
                    'number.base': 'Frequency must be a valid number',
                }),
                timePeriod: joi_1.default.string()
                    .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                    .required()
                    .messages({
                    'any.required': 'Time period is required',
                    'string.base': 'Time period must be a string',
                    'string.empty': 'Time period cannot be empty',
                    'any.only': 'Time period must be one of the following: Weekly, Monthly, Custom, Fortnightly, Daily',
                }),
            }))
                .optional()
                .messages({
                'array.base': 'Intervals must be an array',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
    async updateCaseAffiliation(req, res, next) {
        const schema = joi_1.default.object({
            affiliateLink: joi_1.default.string().required().messages({
                'string.empty': 'Affilate link cannot be empty.',
                'string.base': 'Affilate link should be a string',
                'any.required': 'Affilate link is required',
            }),
            affiliateEmail: joi_1.default.string().email().required().messages({
                'string.base': 'Affiliate email should be a string',
                'string.email': 'Affiliate email should be a valid email address',
                'any.required': 'Affiliate email is required',
            }),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
}
exports.default = new CaseValidate();
//# sourceMappingURL=case.validate.js.map