"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class CaseValidate {
    async validateCase(req, res, next) {
        const schema = joi_1.default.object({
            // documents: Joi.array().items(
            //   Joi.object({
            //     key: Joi.string().required(),
            //     originalFileName: Joi.string().required(),
            //   }).optional()
            // ),
            // debtor: Joi.object({
            //   basicInformation: Joi.object({
            //     fullName: Joi.string().required(),
            //     email: Joi.string().email().required(),
            //     SSID: Joi.string()
            //       .pattern(/^\d{9}$/)
            //       .required(),
            //     country: Joi.string().required(),
            //     state: Joi.string().required(),
            //     status: Joi.string()
            //       .valid('Customer', 'On hold', 'Canceled', 'Declared Bankrupcy')
            //       .required(),
            //     city: Joi.string().required(),
            //     zipCode: Joi.string().required(),
            //     phone: Joi.string()
            //       .pattern(/^\+\d{11}$/)
            //       .required(),
            //     address: Joi.string().required(),
            //     weeklyBudget: Joi.number(),
            //   }),
            //   businessInformation: Joi.object({
            //     companyName: Joi.string().required(),
            //     EIN: Joi.string()
            //       .pattern(/^\d{9}$/)
            //       .required(),
            //     businessCategory: Joi.string().required(),
            //     description: Joi.string().allow(''),
            //     country: Joi.string().required(),
            //     state: Joi.string().required(),
            //     city: Joi.string().required(),
            //     zipCode: Joi.string().required(),
            //     phone: Joi.string()
            //       .pattern(/^\+\d{11}$/)
            //       .required(),
            //     address: Joi.string().required(),
            //   }),
            //   contacts: Joi.array().items(
            //     Joi.object({
            //       name: Joi.string().required(),
            //       title: Joi.string().required(),
            //       phone: Joi.string()
            //         .pattern(/^\+\d{11}$/)
            //         .required(),
            //       email: Joi.string().email().required(),
            //       relationWithDebtor: Joi.string().allow(''),
            //       country: Joi.string().allow(''),
            //       state: Joi.string().allow(''),
            //       city: Joi.string().allow(''),
            //       zipCode: Joi.string().allow(''),
            //     })
            //   ),
            // }),
            creditor: joi_1.default.object({
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    businessCategory: joi_1.default.string().required(),
                }),
                contacts: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
                    relationWithDebtor: joi_1.default.string().allow(''),
                    country: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                })),
                notes: joi_1.default.string().allow(''),
                creditorSecurityKey: joi_1.default.string(),
                accountTitle: joi_1.default.string().optional().allow('', null),
                lastFundedDate: joi_1.default.date().required(),
                historicalRange: joi_1.default.object({
                    minimum: joi_1.default.number().strict().required(),
                    maximum: joi_1.default.number().strict().required(),
                }),
            }),
            totalDebt: joi_1.default.number().strict().required(),
            lastPaymentDate: joi_1.default.date(),
            paidAmount: joi_1.default.number().strict().required(),
            remaining: joi_1.default.number().strict().required(),
            confidence: joi_1.default.number().strict(),
            closeDate: joi_1.default.date(),
            paymentToken: joi_1.default.string().allow(''),
            paymentType: joi_1.default.string().valid('cc', 'ck').allow(''),
            status: joi_1.default.string().required(),
            notes: joi_1.default.string(),
            chatId: joi_1.default.string(),
            feePayment: joi_1.default.string().valid('paidViaCash', 'toPay', 'paidViaThirdParty'),
            intervals: joi_1.default.array().items(joi_1.default.object({
                amount: joi_1.default.number().strict().required(),
                startDate: joi_1.default.date().required(),
                frequency: joi_1.default.number().optional(),
                timePeriod: joi_1.default.string()
                    .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                    .required(),
            })).optional(),
        });
        if (req.query.bulk === 'true') {
            const cases = req.body.cases;
            if (Array.isArray(cases)) {
                for (const tempCase of cases) {
                    const { error } = schema.validate(tempCase);
                    if (error) {
                        return res
                            .status(constants_util_1.default.CODE.BAD_REQUEST)
                            .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label +
                            constants_util_1.default.Messages.INVALID_FIELD));
                    }
                }
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse('Please provide cases array'));
            }
            return next();
        }
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
        }
    }
    async validateCaseAbout(req, res, next) {
        const schema = joi_1.default.object({
            status: joi_1.default.string().required(),
            caseOwner: joi_1.default.string().required(),
            negotiator: joi_1.default.string().required(),
            manager: joi_1.default.string().required(),
            caseOwnerId: joi_1.default.string().required(),
            negotiatorId: joi_1.default.string().required(),
            managerId: joi_1.default.string().required(),
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
            documents: joi_1.default.array().items(joi_1.default.object({
                key: joi_1.default.string().required(),
                originalFileName: joi_1.default.string().required(),
            }).optional()),
            debtor: joi_1.default.object({
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    SSID: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    country: joi_1.default.string().required(),
                    state: joi_1.default.string().required(),
                    status: joi_1.default.string()
                        .valid('Customer', 'On hold', 'Canceled', 'Declared Bankrupcy')
                        .required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                    address: joi_1.default.string().required(),
                    weeklyBudget: joi_1.default.number(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    EIN: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    businessCategory: joi_1.default.string().required(),
                    description: joi_1.default.string().allow(''),
                    country: joi_1.default.string().required(),
                    state: joi_1.default.string().required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                    address: joi_1.default.string().required(),
                }),
                contacts: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
                    relationWithDebtor: joi_1.default.string().allow(''),
                    country: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                })),
            }),
            creditor: joi_1.default.object({
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    businessCategory: joi_1.default.string().required(),
                }),
                contacts: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
                    relationWithDebtor: joi_1.default.string().allow(''),
                    country: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                })),
                notes: joi_1.default.string().allow(''),
                creditorSecurityKey: joi_1.default.string(),
                lastFundedDate: joi_1.default.date(),
                historicalRange: joi_1.default.object({
                    minimum: joi_1.default.number().strict().required(),
                    maximum: joi_1.default.number().strict().required(),
                }),
            }),
            totalDebt: joi_1.default.number().strict(),
            confidence: joi_1.default.number(),
            caseOwner: joi_1.default.string(),
            caseOwnerId: joi_1.default.string(),
            lastPaymentDate: joi_1.default.date(),
            paidAmount: joi_1.default.number().strict(),
            remaining: joi_1.default.number().strict(),
            // paymentToken: Joi.string().allow(''),
            // paymentType: Joi.string().valid('cc', 'ck').allow(''),
            status: joi_1.default.string(),
            // feePayment: Joi.string().valid(
            //   'paidViaCash',
            //   'toPay',
            //   'paidViaThirdParty'
            // ),
            intervals: joi_1.default.array().items(joi_1.default.object({
                amount: joi_1.default.number().strict().required(),
                startDate: joi_1.default.date().required(),
                frequency: joi_1.default.number().optional(),
                timePeriod: joi_1.default.string()
                    .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                    .required(),
            })).optional(),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
        }
    }
    async validateCreditorsCases(req, res, next) {
        const schema = joi_1.default.object({
            data: joi_1.default.array().items(joi_1.default.object({
                creditor: joi_1.default.object({
                    paymentType: joi_1.default.string().allow(''),
                    paymentToken: joi_1.default.string().allow(''),
                    basicInformation: joi_1.default.object({
                        fullName: joi_1.default.string().required(),
                        email: joi_1.default.string().email().required(),
                        phone: joi_1.default.string()
                            .pattern(/^\+\d{11}$/)
                            .required(),
                    }),
                    businessInformation: joi_1.default.object({
                        companyName: joi_1.default.string().required(),
                        businessCategory: joi_1.default.string().required(),
                    }),
                    contacts: joi_1.default.array().items(joi_1.default.object({
                        name: joi_1.default.string().required(),
                        title: joi_1.default.string().required(),
                        phone: joi_1.default.string()
                            .pattern(/^\+\d{11}$/)
                            .required(),
                        email: joi_1.default.string().email().required(),
                        relationWithDebtor: joi_1.default.string().allow(''),
                        country: joi_1.default.string().allow(''),
                        state: joi_1.default.string().allow(''),
                        city: joi_1.default.string().allow(''),
                        zipCode: joi_1.default.string().allow(''),
                    })),
                    notes: joi_1.default.string().allow(''),
                    creditorSecurityKey: joi_1.default.string(),
                    accountTitle: joi_1.default.string().optional().allow('', null),
                    lastFundedDate: joi_1.default.date().required(),
                    historicalRange: joi_1.default.object({
                        minimum: joi_1.default.number().strict().required(),
                        maximum: joi_1.default.number().strict().required(),
                    }),
                }),
                totalDebt: joi_1.default.number().strict().optional(),
                lastPaymentDate: joi_1.default.date().optional(),
                paidAmount: joi_1.default.number().strict().optional(),
                remaining: joi_1.default.number().strict().optional(),
                confidence: joi_1.default.number().strict(),
                closeDate: joi_1.default.date(),
                status: joi_1.default.string().optional(),
                notes: joi_1.default.string(),
                chatId: joi_1.default.string(),
                feePayment: joi_1.default.string()
                    .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                    .optional(),
                intervals: joi_1.default.array()
                    .items(joi_1.default.object({
                    amount: joi_1.default.number().strict().required(),
                    startDate: joi_1.default.date().required(),
                    frequency: joi_1.default.number().optional(),
                    timePeriod: joi_1.default.string()
                        .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                        .required(),
                }))
                    .optional(),
            })),
        });
        const { error } = schema.validate(req.body);
        if (!error) {
            return next();
        }
        else {
            return res
                .status(constants_util_1.default.CODE.BAD_REQUEST)
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
        }
    }
}
exports.default = new CaseValidate();
//# sourceMappingURL=case.validate.js.map