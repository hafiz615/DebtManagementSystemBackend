"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
class DebtorRequests {
    constructor() {
        this.validateDebtor = (req, res, next) => {
            const schema = joi_1.default.object({
                paymentToken: joi_1.default.string().optional().allow(''),
                paymentType: joi_1.default.string().optional().allow(''),
                profitMargin: joi_1.default.number().optional(),
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required().messages({
                        'any.required': 'Full Name is a required field.',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'any.required': 'Email is a required field.',
                        'string.email': 'Email must be a valid email address.',
                    }),
                    SSID: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required()
                        .messages({
                        'any.required': 'SSID is a required field.',
                        'string.pattern.base': 'SSID must be a 9-digit number.',
                    }),
                    state: joi_1.default.string().required().messages({
                        'any.required': 'State is a required field.',
                    }),
                    status: joi_1.default.string().required().messages({
                        'any.required': 'Status is a required field.',
                    }),
                    city: joi_1.default.string().required().messages({
                        'any.required': 'City is a required field.',
                    }),
                    zipCode: joi_1.default.string().required().messages({
                        'any.required': 'Zip Code is a required field.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'any.required': 'Phone number is a required field.',
                        'string.pattern.base': 'Phone number must be a 10-digit number.',
                    }),
                    address: joi_1.default.string().required().messages({
                        'any.required': 'Address is a required field.',
                    }),
                    weeklyBudget: joi_1.default.number().optional(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required().messages({
                        'any.required': 'Company Name is a required field.',
                    }),
                    EIN: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required()
                        .messages({
                        'any.required': 'EIN is a required field.',
                        'string.pattern.base': 'EIN must be a 9-digit number.',
                    }),
                    businessCategory: joi_1.default.string().required().messages({
                        'any.required': 'Business Category is a required field.',
                    }),
                    description: joi_1.default.string().allow(''),
                    state: joi_1.default.string().required().messages({
                        'any.required': 'State is a required field.',
                    }),
                    city: joi_1.default.string().required().messages({
                        'any.required': 'City is a required field.',
                    }),
                    zipCode: joi_1.default.string().required().messages({
                        'any.required': 'Zip Code is a required field.',
                    }),
                    phone: joi_1.default.string().pattern(/^\d{10}$/),
                    address: joi_1.default.string().required().messages({
                        'any.required': 'Address is a required field.',
                    }),
                }),
                contact: joi_1.default.object({
                    name: joi_1.default.string().required().messages({
                        'any.required': 'Contact Name is a required field.',
                    }),
                    title: joi_1.default.string().required().messages({
                        'any.required': 'Title is a required field.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'any.required': 'Contact Phone number is a required field.',
                        'string.pattern.base': 'Contact Phone number must be a 10-digit number.',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'any.required': 'Contact Email is a required field.',
                        'string.email': 'Contact Email must be a valid email address.',
                    }),
                    relationWithDebtor: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                    _id: joi_1.default.string().optional(),
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
        };
        this.createDebtor = (req, res, next) => {
            const schema = joi_1.default.object({
                documents: joi_1.default.array().items(joi_1.default.object({
                    key: joi_1.default.string().required(),
                    originalFileName: joi_1.default.string().required(),
                }).optional()),
                mcaDocuments: joi_1.default.array().items(joi_1.default.object({
                    key: joi_1.default.string().required(),
                    originalFileName: joi_1.default.string().required(),
                }).optional()),
                bankStatementDocuments: joi_1.default.array().items(joi_1.default.object({
                    key: joi_1.default.string().required(),
                    originalFileName: joi_1.default.string().required(),
                }).optional()),
                otherDocuments: joi_1.default.array().items(joi_1.default.object({
                    key: joi_1.default.string().required(),
                    originalFileName: joi_1.default.string().required(),
                }).optional()),
                paymentType: joi_1.default.string().allow(''),
                paymentToken: joi_1.default.string().allow(''),
                extractedFields: joi_1.default.array().allow(null).optional(),
                profitMargin: joi_1.default.number().optional(),
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required().messages({
                        'any.required': 'Full Name is a required field.',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'any.required': 'Email is a required field.',
                        'string.email': 'Email must be a valid email address.',
                    }),
                    SSID: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required()
                        .messages({
                        'any.required': 'SSID is a required field.',
                        'string.pattern.base': 'SSID must be a 9-digit number.',
                    }),
                    state: joi_1.default.string().required().messages({
                        'any.required': 'State is a required field.',
                    }),
                    status: joi_1.default.string().required().messages({
                        'any.required': 'Status is a required field.',
                    }),
                    city: joi_1.default.string().required().messages({
                        'any.required': 'City is a required field.',
                    }),
                    zipCode: joi_1.default.string().required().messages({
                        'any.required': 'Zip Code is a required field.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'any.required': 'Phone number is a required field.',
                        'string.pattern.base': 'Phone number must be a 10-digit number.',
                    }),
                    address: joi_1.default.string().required().messages({
                        'any.required': 'Address is a required field.',
                    }),
                    weeklyBudget: joi_1.default.number().optional(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required().messages({
                        'any.required': 'Company Name is a required field.',
                    }),
                    EIN: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required()
                        .messages({
                        'any.required': 'EIN is a required field.',
                        'string.pattern.base': 'EIN must be a 9-digit number.',
                    }),
                    businessCategory: joi_1.default.string().required().messages({
                        'any.required': 'Business Category is a required field.',
                    }),
                    description: joi_1.default.string().allow(''),
                    state: joi_1.default.string().required().messages({
                        'any.required': 'State is a required field.',
                    }),
                    city: joi_1.default.string().required().messages({
                        'any.required': 'City is a required field.',
                    }),
                    zipCode: joi_1.default.string().required().messages({
                        'any.required': 'Zip Code is a required field.',
                    }),
                    phone: joi_1.default.string().pattern(/^\d{10}$/),
                    address: joi_1.default.string().required().messages({
                        'any.required': 'Address is a required field.',
                    }),
                }),
                contacts: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required().messages({
                        'any.required': 'Contact Name is a required field.',
                    }),
                    title: joi_1.default.string().required().messages({
                        'any.required': 'Title is a required field.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'any.required': 'Contact Phone number is a required field.',
                        'string.pattern.base': 'Contact Phone number must be a 10-digit number.',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'any.required': 'Contact Email is a required field.',
                        'string.email': 'Contact Email must be a valid email address.',
                    }),
                    relationWithDebtor: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
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
        };
        this.updateDebtorBulk = (req, res, next) => {
            const schema = joi_1.default.object({
                documents: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required().messages({
                        'string.base': 'Document key must be a string',
                        'any.required': 'Document key is required',
                    }),
                    originalFileName: joi_1.default.string().required().messages({
                        'string.base': 'Original file name must be a string',
                        'any.required': 'Original file name is required',
                    }),
                }))
                    .optional(),
                mcaDocuments: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required().messages({
                        'string.base': 'MCA document key must be a string',
                        'any.required': 'MCA document key is required',
                    }),
                    originalFileName: joi_1.default.string().required().messages({
                        'string.base': 'MCA original file name must be a string',
                        'any.required': 'MCA original file name is required',
                    }),
                }))
                    .optional(),
                bankStatementDocuments: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required().messages({
                        'string.base': 'Bank statement key must be a string',
                        'any.required': 'Bank statement key is required',
                    }),
                    originalFileName: joi_1.default.string().required().messages({
                        'string.base': 'Bank statement original file name must be a string',
                        'any.required': 'Bank statement original file name is required',
                    }),
                }))
                    .optional(),
                otherDocuments: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required().messages({
                        'string.base': 'Other document key must be a string',
                        'any.required': 'Other document key is required',
                    }),
                    originalFileName: joi_1.default.string().required().messages({
                        'string.base': 'Other document original file name must be a string',
                        'any.required': 'Other document original file name is required',
                    }),
                }))
                    .optional(),
                paymentType: joi_1.default.string().allow('').messages({
                    'string.base': 'Payment type must be a string',
                }),
                paymentToken: joi_1.default.string().allow('').messages({
                    'string.base': 'Payment token must be a string',
                }),
                extractedFields: joi_1.default.array().allow(null).optional().messages({
                    'array.base': 'Extracted fields must be an array',
                }),
                profitMargin: joi_1.default.number().optional().messages({
                    'number.base': 'Profit margin must be a number',
                }),
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required().messages({
                        'string.base': 'Full name must be a string',
                        'any.required': 'Full name is required',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'string.email': 'Email must be a valid email address',
                        'any.required': 'Email is required',
                    }),
                    SSID: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required()
                        .messages({
                        'string.pattern.base': 'SSID must be a 9-digit number',
                        'any.required': 'SSID is required',
                    }),
                    state: joi_1.default.string().required().messages({
                        'string.base': 'State must be a string',
                        'any.required': 'State is required',
                    }),
                    status: joi_1.default.string().required().messages({
                        'string.base': 'Status must be a string',
                        'any.required': 'Status is required',
                    }),
                    city: joi_1.default.string().required().messages({
                        'string.base': 'City must be a string',
                        'any.required': 'City is required',
                    }),
                    zipCode: joi_1.default.string().required().messages({
                        'string.base': 'Zip code must be a string',
                        'any.required': 'Zip code is required',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'string.pattern.base': 'Phone number must be a 10-digit number',
                        'any.required': 'Phone number is required',
                    }),
                    address: joi_1.default.string().required().messages({
                        'string.base': 'Address must be a string',
                        'any.required': 'Address is required',
                    }),
                    weeklyBudget: joi_1.default.number().optional().messages({
                        'number.base': 'Weekly budget must be a number',
                    }),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required().messages({
                        'string.base': 'Company name must be a string',
                        'any.required': 'Company name is required',
                    }),
                    EIN: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required()
                        .messages({
                        'string.pattern.base': 'EIN must be a 9-digit number',
                        'any.required': 'EIN is required',
                    }),
                    businessCategory: joi_1.default.string().required().messages({
                        'string.base': 'Business category must be a string',
                        'any.required': 'Business category is required',
                    }),
                    description: joi_1.default.string().allow('').messages({
                        'string.base': 'Description must be a string',
                    }),
                    state: joi_1.default.string().required().messages({
                        'string.base': 'State must be a string',
                        'any.required': 'State is required',
                    }),
                    city: joi_1.default.string().required().messages({
                        'string.base': 'City must be a string',
                        'any.required': 'City is required',
                    }),
                    zipCode: joi_1.default.string().required().messages({
                        'string.base': 'Zip code must be a string',
                        'any.required': 'Zip code is required',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .messages({
                        'string.pattern.base': 'Phone number must be a 10-digit number',
                    }),
                    address: joi_1.default.string().required().messages({
                        'string.base': 'Address must be a string',
                        'any.required': 'Address is required',
                    }),
                }),
                contacts: joi_1.default.array()
                    .items(joi_1.default.object({
                    name: joi_1.default.string().required().messages({
                        'string.base': 'Contact name must be a string',
                        'any.required': 'Contact name is required',
                    }),
                    title: joi_1.default.string().required().messages({
                        'string.base': 'Contact title must be a string',
                        'any.required': 'Contact title is required',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'string.pattern.base': 'Contact phone number must be a 10-digit number',
                        'any.required': 'Contact phone number is required',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'string.email': 'Contact email must be a valid email address',
                        'any.required': 'Contact email is required',
                    }),
                    relationWithDebtor: joi_1.default.string().allow('').messages({
                        'string.base': 'Relation with debtor must be a string',
                    }),
                    state: joi_1.default.string().allow('').messages({
                        'string.base': 'State must be a string',
                    }),
                    city: joi_1.default.string().allow('').messages({
                        'string.base': 'City must be a string',
                    }),
                    zipCode: joi_1.default.string().allow('').messages({
                        'string.base': 'Zip code must be a string',
                    }),
                }))
                    .messages({
                    'array.base': 'Contacts must be an array of objects',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.createMultipleDebtors = (req, res, next) => {
            const schema = joi_1.default.object({
                debtors: joi_1.default.array()
                    .items(joi_1.default.object({
                    paymentType: joi_1.default.string().allow('').messages({
                        'string.base': 'Payment type must be a string',
                    }),
                    paymentToken: joi_1.default.string().allow('').messages({
                        'string.base': 'Payment token must be a string',
                    }),
                    extractedFields: joi_1.default.array().allow(null).optional().messages({
                        'array.base': 'Extracted fields must be an array',
                    }),
                    driveUrl: joi_1.default.string().allow('').messages({
                        'string.base': 'Drive URL must be a string',
                    }),
                    profitMargin: joi_1.default.number().optional().messages({
                        'number.base': 'Profit margin must be a number',
                    }),
                    basicInformation: joi_1.default.object({
                        fullName: joi_1.default.string().required().allow('').messages({
                            'string.base': 'Full name must be a string',
                            'any.required': 'Full name is required',
                        }),
                        email: joi_1.default.string().email().required().allow('').messages({
                            'string.email': 'Email must be a valid email address',
                            'any.required': 'Email is required',
                        }),
                        SSID: joi_1.default.string().allow('').messages({
                            'string.base': 'SSID must be a string',
                        }),
                        state: joi_1.default.string().allow('').messages({
                            'string.base': 'State must be a string',
                        }),
                        status: joi_1.default.string().allow('').messages({
                            'string.base': 'Status must be a string',
                        }),
                        city: joi_1.default.string().allow('').messages({
                            'string.base': 'City must be a string',
                        }),
                        zipCode: joi_1.default.string().allow('').messages({
                            'string.base': 'Zip code must be a string',
                        }),
                        phone: joi_1.default.string().allow('').messages({
                            'string.base': 'Phone must be a string',
                        }),
                        address: joi_1.default.string().allow('').messages({
                            'string.base': 'Address must be a string',
                        }),
                        weeklyBudget: joi_1.default.number().optional().messages({
                            'number.base': 'Weekly budget must be a number',
                        }),
                    }),
                    businessInformation: joi_1.default.object({
                        companyName: joi_1.default.string().required().allow('').messages({
                            'string.base': 'Company name must be a string',
                            'any.required': 'Company name is required',
                        }),
                        EIN: joi_1.default.string().allow('').messages({
                            'string.base': 'EIN must be a string',
                        }),
                        businessCategory: joi_1.default.string().allow('').messages({
                            'string.base': 'Business category must be a string',
                        }),
                        description: joi_1.default.string().allow('').messages({
                            'string.base': 'Description must be a string',
                        }),
                        state: joi_1.default.string().allow('').messages({
                            'string.base': 'State must be a string',
                        }),
                        city: joi_1.default.string().allow('').messages({
                            'string.base': 'City must be a string',
                        }),
                        zipCode: joi_1.default.string().allow('').messages({
                            'string.base': 'Zip code must be a string',
                        }),
                        phone: joi_1.default.string().allow('').messages({
                            'string.base': 'Phone must be a string',
                        }),
                        address: joi_1.default.string().allow('').messages({
                            'string.base': 'Address must be a string',
                        }),
                    }),
                    contacts: joi_1.default.array()
                        .items(joi_1.default.object({
                        name: joi_1.default.string().required().messages({
                            'string.base': 'Contact name must be a string',
                            'any.required': 'Contact name is required',
                        }),
                        title: joi_1.default.string().required().messages({
                            'string.base': 'Contact title must be a string',
                            'any.required': 'Contact title is required',
                        }),
                        phone: joi_1.default.string().required().messages({
                            'string.base': 'Contact phone must be a string',
                            'any.required': 'Contact phone is required',
                        }),
                        email: joi_1.default.string().email().required().messages({
                            'string.email': 'Contact email must be a valid email address',
                            'any.required': 'Contact email is required',
                        }),
                        relationWithDebtor: joi_1.default.string().allow('').messages({
                            'string.base': 'Relation with debtor must be a string',
                        }),
                        state: joi_1.default.string().allow('').messages({
                            'string.base': 'State must be a string',
                        }),
                        city: joi_1.default.string().allow('').messages({
                            'string.base': 'City must be a string',
                        }),
                        zipCode: joi_1.default.string().allow('').messages({
                            'string.base': 'Zip code must be a string',
                        }),
                    }))
                        .messages({
                        'array.base': 'Contacts must be an array',
                    }),
                }))
                    .messages({
                    'array.base': 'Debtors must be an array',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.addDebtorAccount = (req, res, next) => {
            const schema = joi_1.default.object({
                paymentType: joi_1.default.string().required().messages({
                    'string.base': 'Payment type must be a string',
                    'any.required': 'Payment type is required',
                }),
                paymentToken: joi_1.default.string().required().messages({
                    'string.base': 'Payment token must be a string',
                    'any.required': 'Payment token is required',
                }),
                platform: joi_1.default.string()
                    .valid('Easypay direct', 'Seamlesschex merchant')
                    .required()
                    .messages({
                    'string.base': 'Platform must be a string',
                    'any.required': 'Platform is required',
                    'any.only': "Platform must be either 'Easypay direct' or 'Seamlesschex merchant'",
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.saveWeeklyBudgetValues = (req, res, next) => {
            const schema = joi_1.default.object({
                strategy1Profit: joi_1.default.number().strict().messages({
                    'number.base': 'Strategy 1 profit must be a number',
                }),
                strategy1Weekly: joi_1.default.number().strict().messages({
                    'number.base': 'Strategy 1 weekly value must be a number',
                }),
                strategy1Custom: joi_1.default.number().strict().messages({
                    'number.base': 'Strategy 1 custom value must be a number',
                }),
                strategy1Choosen: joi_1.default.string().messages({
                    'string.base': 'Strategy 1 chosen value must be a string',
                }),
                strategy3Profit: joi_1.default.number().strict().messages({
                    'number.base': 'Strategy 3 profit must be a number',
                }),
                strategy3ProfitMargin: joi_1.default.number().strict().messages({
                    'number.base': 'Strategy 3 profit margin must be a number',
                }),
                strategy3Custom: joi_1.default.number().strict().messages({
                    'number.base': 'Strategy 3 custom value must be a number',
                }),
                strategy3Choosen: joi_1.default.string().messages({
                    'string.base': 'Strategy 3 chosen value must be a string',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.validateManualPayment = (req, res, next) => {
            const schema = joi_1.default.object({
                debtorId: joi_1.default.string().required().messages({
                    'string.base': 'Debtor ID must be a string',
                    'any.required': 'Debtor ID is required',
                }),
                transactionIds: joi_1.default.array().items(joi_1.default.string()).required().messages({
                    'array.base': 'Transaction IDs must be an array',
                    'any.required': 'Transaction IDs are required',
                }),
                amount: joi_1.default.number().required().messages({
                    'number.base': 'Amount must be a number',
                    'any.required': 'Amount is required',
                }),
                commission: joi_1.default.number().required().messages({
                    'number.base': 'Commission must be a number',
                    'any.required': 'Commission is required',
                }),
                transactionDate: joi_1.default.date().required().messages({
                    'date.base': 'Transaction date must be a valid date',
                    'any.required': 'Transaction date is required',
                }),
                transactionType: joi_1.default.string()
                    .valid('Wire', 'Check', 'Cash')
                    .required()
                    .messages({
                    'string.base': 'Transaction type must be a string',
                    'any.required': 'Transaction type is required',
                    'any.only': "Transaction type must be one of ['Wire', 'Check', 'Cash']",
                }),
                referenceId: joi_1.default.string().required().messages({
                    'string.base': 'Reference ID must be a string',
                    'any.required': 'Reference ID is required',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.revertPayment = async (req, res, next) => {
            const schema = joi_1.default.object({
                commission: joi_1.default.number().required().messages({
                    'number.base': 'Commission must be a number',
                    'any.required': 'Commission is required',
                }),
                referenceId: joi_1.default.string().required().messages({
                    'string.base': 'Reference ID must be a string',
                    'any.required': 'Reference ID is required',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.updateWeeklyBudget = (req, res, next) => {
            const schema = joi_1.default.object({
                weeklyBudget: joi_1.default.number().strict().required().messages({
                    'number.base': 'Weekly budget must be a number',
                    'any.required': 'Weekly budget is required',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.addDocumentsToDebtor = async (req, res, next) => {
            const schema = joi_1.default.object({
                mcaDocuments: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required().messages({
                        'string.base': 'MCA document key must be a string',
                        'any.required': 'MCA document key is required',
                    }),
                    originalFileName: joi_1.default.string().required().messages({
                        'string.base': 'Original file name must be a string',
                        'any.required': 'Original file name is required',
                    }),
                }))
                    .optional()
                    .messages({
                    'array.base': 'MCA documents must be an array',
                }),
                bankStatementDocuments: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required().messages({
                        'string.base': 'Bank statement document key must be a string',
                        'any.required': 'Bank statement document key is required',
                    }),
                    originalFileName: joi_1.default.string().required().messages({
                        'string.base': 'Original file name must be a string',
                        'any.required': 'Original file name is required',
                    }),
                }))
                    .optional()
                    .messages({
                    'array.base': 'Bank statement documents must be an array',
                }),
                otherDocuments: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required().messages({
                        'string.base': 'Other document key must be a string',
                        'any.required': 'Other document key is required',
                    }),
                    originalFileName: joi_1.default.string().required().messages({
                        'string.base': 'Original file name must be a string',
                        'any.required': 'Original file name is required',
                    }),
                }))
                    .optional()
                    .messages({
                    'array.base': 'Other documents must be an array',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
        this.syncDebtorEmail = async (req, res, next) => {
            const schema = joi_1.default.object({
                email: joi_1.default.string().email().required().messages({
                    'string.email': 'Email must be a valid email address',
                    'any.required': 'Email is required',
                }),
                platform: joi_1.default.string().required().messages({
                    'string.base': 'Platform must be a string',
                    'any.required': 'Platform is required',
                }),
            });
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (!error) {
                return next();
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
            }
        };
    }
}
exports.default = new DebtorRequests();
//# sourceMappingURL=debtor.validate.js.map