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
                        .pattern(/^\d{10}$/)
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
                        .pattern(/^\d{10}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
                    relationWithCreditor: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                })),
                notes: joi_1.default.string().allow(''),
                creditorSecurityKey: joi_1.default.string(),
                accountTitle: joi_1.default.string().optional().allow('', null),
                lastFundedDate: joi_1.default.date().optional(),
                historicalRange: joi_1.default.object({
                    minimum: joi_1.default.number().strict().optional(),
                    maximum: joi_1.default.number().strict().optional(),
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
            creditor: joi_1.default.object({
                aggression: joi_1.default.number().optional().min(0).max(10),
                _id: joi_1.default.string().optional().allow(''),
                paymentType: joi_1.default.string().allow(''),
                paymentToken: joi_1.default.string().allow(''),
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    businessCategory: joi_1.default.string().allow(''),
                }),
                contacts: joi_1.default.array()
                    .items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
                    relationWithCreditor: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                    _id: joi_1.default.string().optional(),
                }))
                    .optional(),
                notes: joi_1.default.string().allow(''),
                creditorSecurityKey: joi_1.default.string().optional().allow(''),
                paynoteSourceId: joi_1.default.string().optional().allow(''),
                paynoteUserId: joi_1.default.string().optional().allow(''),
                accountTitle: joi_1.default.string().optional().allow('', null),
                lastFundedDate: joi_1.default.date().optional().allow(''),
                historicalRange: joi_1.default.object({
                    minimum: joi_1.default.number().strict().optional(),
                    maximum: joi_1.default.number().strict().optional(),
                }),
            })
                .optional()
                .allow(null),
            totalDebt: joi_1.default.number().strict().optional(),
            lastPaymentDate: joi_1.default.date().optional().allow(''),
            paidAmount: joi_1.default.number().strict().optional(),
            commission: joi_1.default.number().strict().allow(0),
            totalCommission: joi_1.default.number().strict().allow(0),
            remaining: joi_1.default.number().strict().optional(),
            confidence: joi_1.default.number().strict(),
            isExempt: joi_1.default.boolean().optional(),
            contractDetails: joi_1.default.object().optional().allow(null),
            closeDate: joi_1.default.date(),
            status: joi_1.default.string().optional(),
            notes: joi_1.default.string(),
            chatId: joi_1.default.string(),
            feePayment: joi_1.default.string()
                .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                .optional()
                .allow(''),
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
            // lawsuit fields
            paymentFrequency: joi_1.default.string().optional().allow(''),
            impliedInterestRate: joi_1.default.number().strict().optional(),
            averageInterestRate: joi_1.default.number().strict().optional(),
            lawsuitFile: joi_1.default.array()
                .items(joi_1.default.object({
                key: joi_1.default.string().required(),
                originalFileName: joi_1.default.string().required(),
                url: joi_1.default.string().optional().allow(''),
            }))
                .optional(),
            hasLawsuits: joi_1.default.boolean().optional(),
            lawsuitCreditorTags: joi_1.default.array().items(joi_1.default.string()).optional(),
            dateServed: joi_1.default.date().optional(),
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
                    aggression: joi_1.default.number().optional().min(0).max(10),
                    paymentType: joi_1.default.string().allow(''),
                    paymentToken: joi_1.default.string().allow(''),
                    basicInformation: joi_1.default.object({
                        fullName: joi_1.default.string().required(),
                        email: joi_1.default.string().email().required(),
                        phone: joi_1.default.string()
                            .pattern(/^\d{10}$/)
                            .required(),
                    }),
                    businessInformation: joi_1.default.object({
                        companyName: joi_1.default.string().required(),
                        businessCategory: joi_1.default.string().allow(''),
                    }),
                    contacts: joi_1.default.array().items(joi_1.default.object({
                        name: joi_1.default.string().required(),
                        title: joi_1.default.string().required(),
                        phone: joi_1.default.string()
                            .pattern(/^\d{10}$/)
                            .required(),
                        email: joi_1.default.string().email().required(),
                        relationWithCreditor: joi_1.default.string().allow(''),
                        state: joi_1.default.string().allow(''),
                        city: joi_1.default.string().allow(''),
                        zipCode: joi_1.default.string().allow(''),
                    })),
                    notes: joi_1.default.string().allow(''),
                    paynoteSourceId: joi_1.default.string().optional().allow(''),
                    paynoteUserId: joi_1.default.string().optional().allow(''),
                    creditorSecurityKey: joi_1.default.string().optional().allow(''),
                    accountTitle: joi_1.default.string().optional().allow('', null),
                    lastFundedDate: joi_1.default.date().optional().allow(''),
                    historicalRange: joi_1.default.object({
                        minimum: joi_1.default.number().strict().optional(),
                        maximum: joi_1.default.number().strict().optional(),
                    }),
                }).allow(null),
                totalDebt: joi_1.default.number().strict().optional(),
                lastPaymentDate: joi_1.default.date().optional().allow(''),
                paidAmount: joi_1.default.number().strict().optional(),
                remaining: joi_1.default.number().strict().optional(),
                confidence: joi_1.default.number().strict(),
                isExempt: joi_1.default.boolean().optional(),
                contractDetails: joi_1.default.object().optional().allow(null),
                closeDate: joi_1.default.date(),
                status: joi_1.default.string().optional(),
                notes: joi_1.default.string(),
                chatId: joi_1.default.string(),
                commisionPercentage: joi_1.default.number().strict(),
                feePayment: joi_1.default.string()
                    .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                    .optional()
                    .allow(''),
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
                // lawsuit fields
                paymentFrequency: joi_1.default.string().optional().allow(''),
                impliedInterestRate: joi_1.default.number().strict().optional(),
                averageInterestRate: joi_1.default.number().strict().optional(),
                lawsuitFile: joi_1.default.array()
                    .items(joi_1.default.object({
                    key: joi_1.default.string().required(),
                    originalFileName: joi_1.default.string().required(),
                    url: joi_1.default.string().optional().allow(''),
                }))
                    .optional(),
                hasLawsuits: joi_1.default.boolean().optional(),
                lawsuitCreditorTags: joi_1.default.array().items(joi_1.default.string()).optional(),
                dateServed: joi_1.default.date().optional(),
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
    async validateAddNotes(req, res, next) {
        const schema = joi_1.default.object({
            notes: joi_1.default.string().required(),
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
    async sendEmail(req, res, next) {
        const schema = joi_1.default.object({
            sendTo: joi_1.default.string().email().required(),
            from: joi_1.default.string().email().required(),
            content: joi_1.default.string().required(),
            subject: joi_1.default.string().required(),
            cc: joi_1.default.array().items(joi_1.default.string().email()),
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
    async sendSmsEmailDebtorCreditor(req, res, next) {
        const type = String(req.query.type);
        let object = joi_1.default.object({
            sendTo: joi_1.default.string().email().required(),
            from: joi_1.default.string().email().required(),
            content: joi_1.default.string().required(),
            subject: joi_1.default.string().required(),
            cc: joi_1.default.string().required(),
        });
        if (req.body?.cc && typeof req.body?.cc === 'string') {
            console.log(req.body.cc);
            console.log(typeof req.body?.cc, 'typeoffff');
            if (!Array.isArray(JSON.parse(req.body.cc))) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse('cc is invalid'));
            }
        }
        if (type === 'sms') {
            object = joi_1.default.object({
                sendTo: joi_1.default.string()
                    .pattern(/^\d{10}$/)
                    .required(),
                content: joi_1.default.string().required(),
                subject: joi_1.default.string().optional(),
            });
        }
        const schema = object;
        console.log(req.body.sendTo);
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
    async saveJustification(req, res, next) {
        const schema = joi_1.default.object({
            gemini: joi_1.default.boolean().required(),
            llama: joi_1.default.boolean().required(),
            chatgpt: joi_1.default.boolean().required(),
            claude: joi_1.default.boolean().required(),
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
    async updateContractDetails(req, res, next) {
        const schema = joi_1.default.object({
            label: joi_1.default.string().required(),
            value: joi_1.default.string().required(),
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
    async updateCasePlan(req, res, next) {
        const schema = joi_1.default.object({
            commission: joi_1.default.number().strict().allow(0).optional(),
            isExempt: joi_1.default.boolean().optional(),
            feePayment: joi_1.default.string()
                .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
                .optional()
                .allow(''),
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