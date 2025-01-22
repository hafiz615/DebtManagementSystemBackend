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
class CreditorRequests {
    constructor() {
        this.validateCreditor = (req, res, next) => {
            const schema = joi_1.default.object({
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required().messages({
                        'any.required': 'Full name is required.',
                        'string.empty': 'Full name cannot be empty.',
                        'string.base': 'Full name must be a string.',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'any.required': 'Email is required.',
                        'string.empty': 'Email cannot be empty.',
                        'string.email': 'Invalid email format.',
                        'string.base': 'Email must be a string.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'any.required': 'Phone number is required.',
                        'string.empty': 'Phone number cannot be empty.',
                        'string.base': 'Phone number must be a string.',
                        'string.pattern.base': 'Phone number must be exactly 10 digits.',
                    }),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required().messages({
                        'any.required': 'Company name is required.',
                        'string.empty': 'Company name cannot be empty.',
                        'string.base': 'Company name must be a string.',
                    }),
                    businessCategory: joi_1.default.string().allow('').messages({
                        'string.base': 'Business category must be a string.',
                    }),
                }),
                accountTitle: joi_1.default.string().optional().allow('', null).messages({
                    'string.base': 'Account title must be a string.',
                }),
                contact: joi_1.default.object({
                    name: joi_1.default.string().required().messages({
                        'any.required': 'Contact name is required.',
                        'string.empty': 'Contact name cannot be empty.',
                        'string.base': 'Contact name must be a string.',
                    }),
                    title: joi_1.default.string().required().messages({
                        'any.required': 'Contact title is required.',
                        'string.empty': 'Contact title cannot be empty.',
                        'string.base': 'Contact title must be a string.',
                    }),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required()
                        .messages({
                        'any.required': 'Contact phone number is required.',
                        'string.empty': 'Contact phone number cannot be empty.',
                        'string.base': 'Contact phone number must be a string.',
                        'string.pattern.base': 'Contact phone number must be 10 digits.',
                    }),
                    email: joi_1.default.string().email().required().messages({
                        'any.required': 'Contact email is required.',
                        'string.empty': 'Contact email cannot be empty.',
                        'string.email': 'Invalid contact email format.',
                        'string.base': 'Contact email must be a string.',
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
                        'string.base': 'ID must be a string.',
                    }),
                }),
                paymentToken: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Payment token must be a string.',
                }),
                paymentType: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Payment type must be a string.',
                }),
                paynoteSourceId: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Paynote source ID must be a string.',
                }),
                paynoteUserId: joi_1.default.string().optional().allow('').messages({
                    'string.base': 'Paynote user ID must be a string.',
                }),
                lastFundedDate: joi_1.default.date().optional().allow('').messages({
                    'date.base': 'Last funded date must be a valid date.',
                }),
                historicalRange: joi_1.default.object({
                    minimum: joi_1.default.number().strict().optional().messages({
                        'number.base': 'Minimum historical range must be a number.',
                    }),
                    maximum: joi_1.default.number().strict().optional().messages({
                        'number.base': 'Maximum historical range must be a number.',
                    }),
                })
                    .optional()
                    .allow(null),
                aggression: joi_1.default.number().optional().min(0).max(10).messages({
                    'number.base': 'Aggression must be a number.',
                    'number.min': 'Aggression must be at least 0.',
                    'number.max': 'Aggression must not exceed 10.',
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
        this.validateMultipleCreditors = (req, res, next) => {
            const schema = joi_1.default.object({
                cases: joi_1.default.array()
                    .items(joi_1.default.object({
                    _id: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Case ID must be a string.',
                    }),
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
                    contractDetails: joi_1.default.object().optional().allow(null).messages({
                        'object.base': 'Contract details must be an object.',
                    }),
                    status: joi_1.default.string().optional().allow('').messages({
                        'string.base': 'Status must be a string.',
                    }),
                    feePayment: joi_1.default.string()
                        .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                        .optional()
                        .allow('')
                        .messages({
                        'string.base': 'Fee payment must be a string.',
                        'any.only': 'Fee payment must be one of [paidViaCash, toPay, paidViaThirdParty].',
                    }),
                    creditor: joi_1.default.object({
                        aggression: joi_1.default.number().optional().min(0).max(10).messages({
                            'number.base': 'Aggression must be a number.',
                            'number.min': 'Aggression must be at least 0.',
                            'number.max': 'Aggression must not exceed 10.',
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
                                'any.required': 'Creditor full name is required.',
                                'string.empty': 'Creditor full name cannot be empty.',
                                'string.base': 'Creditor full name must be a string.',
                            }),
                            email: joi_1.default.string().email().required().messages({
                                'any.required': 'Creditor email is required.',
                                'string.empty': 'Creditor email cannot be empty.',
                                'string.email': 'Invalid creditor email format.',
                                'string.base': 'Creditor email must be a string.',
                            }),
                            phone: joi_1.default.string()
                                .pattern(/^\d{10}$/)
                                .required()
                                .messages({
                                'any.required': 'Creditor phone number is required.',
                                'string.empty': 'Creditor phone number cannot be empty.',
                                'string.base': 'Creditor phone number must be a string.',
                                'string.pattern.base': 'Creditor phone number must be exactly 10 digits.',
                            }),
                        }),
                        businessInformation: joi_1.default.object({
                            companyName: joi_1.default.string().required().messages({
                                'any.required': 'Creditor company name is required.',
                                'string.empty': 'Creditor company name cannot be empty.',
                                'string.base': 'Creditor company name must be a string.',
                            }),
                            businessCategory: joi_1.default.string().allow('').messages({
                                'string.base': 'Creditor business category must be a string.',
                            }),
                        }),
                        contacts: joi_1.default.array()
                            .items(joi_1.default.object({
                            name: joi_1.default.string().required().messages({
                                'any.required': 'Contact name is required.',
                                'string.empty': 'Contact name cannot be empty.',
                                'string.base': 'Contact name must be a string.',
                            }),
                            title: joi_1.default.string().required().messages({
                                'any.required': 'Contact title is required.',
                                'string.empty': 'Contact title cannot be empty.',
                                'string.base': 'Contact title must be a string.',
                            }),
                            phone: joi_1.default.string()
                                .pattern(/^\d{10}$/)
                                .required()
                                .messages({
                                'any.required': 'Contact phone number is required.',
                                'string.empty': 'Contact phone number cannot be empty.',
                                'string.base': 'Contact phone number must be a string.',
                                'string.pattern.base': 'Contact phone number must be exactly 10 digits.',
                            }),
                            email: joi_1.default.string().email().required().messages({
                                'any.required': 'Contact email is required.',
                                'string.empty': 'Contact email cannot be empty.',
                                'string.email': 'Invalid contact email format.',
                                'string.base': 'Contact email must be a string.',
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
                                'number.base': 'Historical range minimum must be a number.',
                            }),
                            maximum: joi_1.default.number().strict().optional().messages({
                                'number.base': 'Historical range maximum must be a number.',
                            }),
                        }),
                    })
                        .optional()
                        .allow(null),
                }))
                    .messages({
                    'array.base': 'Cases must be an array.',
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
    }
    async syncCreditorEmail(req, res, next) {
        const schema = joi_1.default.object({
            email: joi_1.default.string().email().required().messages({
                'any.required': 'Email is required.',
                'string.empty': 'Email cannot be empty.',
                'string.email': 'Invalid email format.',
                'string.base': 'Email must be a string.',
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
exports.default = new CreditorRequests();
//# sourceMappingURL=creditor.validate.js.map