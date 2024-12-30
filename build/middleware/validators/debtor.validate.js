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
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    SSID: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    state: joi_1.default.string().required(),
                    status: joi_1.default.string().required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                    address: joi_1.default.string().required(),
                    weeklyBudget: joi_1.default.number().optional(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    EIN: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    businessCategory: joi_1.default.string().required(),
                    description: joi_1.default.string().allow(''),
                    state: joi_1.default.string().required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string().pattern(/^\d{10}$/),
                    address: joi_1.default.string().required(),
                }),
                contact: joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
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
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
            }
        };
        this.createDebtor = (req, res, next) => {
            const schema = joi_1.default.object({
                documents: joi_1.default.array().items(joi_1.default.object({
                    key: joi_1.default.string().required(),
                    originalFileName: joi_1.default.string().required(),
                }).optional()),
                paymentType: joi_1.default.string().allow(''),
                paymentToken: joi_1.default.string().allow(''),
                extractedFields: joi_1.default.array().allow(null).optional(),
                profitMargin: joi_1.default.number().optional(),
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    SSID: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    state: joi_1.default.string().required(),
                    status: joi_1.default.string().required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                    address: joi_1.default.string().required(),
                    weeklyBudget: joi_1.default.number().optional(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    EIN: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    businessCategory: joi_1.default.string().required(),
                    description: joi_1.default.string().allow(''),
                    state: joi_1.default.string().required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string().pattern(/^\d{10}$/),
                    address: joi_1.default.string().required(),
                }),
                contacts: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
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
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
            }
        };
        this.updateDebtorBulk = (req, res, next) => {
            const schema = joi_1.default.object({
                documents: joi_1.default.array().items(joi_1.default.object({
                    key: joi_1.default.string().required(),
                    originalFileName: joi_1.default.string().required(),
                }).optional()),
                paymentType: joi_1.default.string().allow(''),
                paymentToken: joi_1.default.string().allow(''),
                extractedFields: joi_1.default.array().allow(null).optional(),
                profitMargin: joi_1.default.number().optional(),
                basicInformation: joi_1.default.object({
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    SSID: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    state: joi_1.default.string().required(),
                    status: joi_1.default.string().required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                    address: joi_1.default.string().required(),
                    weeklyBudget: joi_1.default.number().optional(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    EIN: joi_1.default.string()
                        .pattern(/^\d{9}$/)
                        .required(),
                    businessCategory: joi_1.default.string().required(),
                    description: joi_1.default.string().allow(''),
                    state: joi_1.default.string().required(),
                    city: joi_1.default.string().required(),
                    zipCode: joi_1.default.string().required(),
                    phone: joi_1.default.string().pattern(/^\d{10}$/),
                    address: joi_1.default.string().required(),
                }),
                contacts: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
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
                    .send(responseHelper_util_1.default.get4xxResponse(error.details[0].context.label + constants_util_1.default.Messages.INVALID_FIELD));
            }
        };
        this.createMultipleDebtors = (req, res, next) => {
            const schema = joi_1.default.object({
                debtors: joi_1.default.array().items(joi_1.default.object({
                    paymentType: joi_1.default.string().allow(''),
                    paymentToken: joi_1.default.string().allow(''),
                    extractedFields: joi_1.default.array().allow(null).optional(),
                    driveUrl: joi_1.default.string().allow(''),
                    profitMargin: joi_1.default.number().optional(),
                    basicInformation: joi_1.default.object({
                        fullName: joi_1.default.string().required().allow(''),
                        email: joi_1.default.string().email().required().allow(''),
                        SSID: joi_1.default.string().allow(''),
                        state: joi_1.default.string().allow(''),
                        status: joi_1.default.string().allow(''),
                        city: joi_1.default.string().allow(''),
                        zipCode: joi_1.default.string().allow(''),
                        phone: joi_1.default.string().allow(''),
                        address: joi_1.default.string().allow(''),
                        weeklyBudget: joi_1.default.number().optional(),
                    }),
                    businessInformation: joi_1.default.object({
                        companyName: joi_1.default.string().required().allow(''),
                        EIN: joi_1.default.string().allow(''),
                        businessCategory: joi_1.default.string().allow(''),
                        description: joi_1.default.string().allow(''),
                        state: joi_1.default.string().allow(''),
                        city: joi_1.default.string().allow(''),
                        zipCode: joi_1.default.string().allow(''),
                        phone: joi_1.default.string().allow(''),
                        address: joi_1.default.string().allow(''),
                    }),
                    contacts: joi_1.default.array().items(joi_1.default.object({
                        name: joi_1.default.string().required(),
                        title: joi_1.default.string().required(),
                        phone: joi_1.default.string().required(),
                        email: joi_1.default.string().email().required(),
                        relationWithDebtor: joi_1.default.string().allow(''),
                        state: joi_1.default.string().allow(''),
                        city: joi_1.default.string().allow(''),
                        zipCode: joi_1.default.string().allow(''),
                    })),
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
        };
        this.addDebtorAccount = (req, res, next) => {
            const schema = joi_1.default.object({
                paymentType: joi_1.default.string().required(),
                paymentToken: joi_1.default.string().required(),
                platform: joi_1.default.string().valid('Easypay direct', 'Seamlesschex').required(),
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
        };
        this.saveWeeklyBudgetValues = (req, res, next) => {
            const schema = joi_1.default.object({
                strategy1Profit: joi_1.default.number().strict(),
                strategy1Weekly: joi_1.default.number().strict(),
                strategy1Custom: joi_1.default.number().strict(),
                strategy1Choosen: joi_1.default.string(),
                strategy3Profit: joi_1.default.number().strict(),
                strategy3ProfitMargin: joi_1.default.number().strict(),
                strategy3Custom: joi_1.default.number().strict(),
                strategy3Choosen: joi_1.default.string(),
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
        };
        this.updateWeeklyBudget = (req, res, next) => {
            const schema = joi_1.default.object({
                weeklyBudget: joi_1.default.number().strict().required(),
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
        };
    }
    validateManualPayment(req, res, next) {
        const schema = joi_1.default.object({
            debtorId: joi_1.default.string().required(),
            transactionIds: joi_1.default.array().items(joi_1.default.string()).required(),
            amount: joi_1.default.number().required(),
            commission: joi_1.default.number().required(),
            transactionDate: joi_1.default.date().required(),
            transactionType: joi_1.default.string().valid('Wire', 'Check', 'Cash').required(),
            referenceId: joi_1.default.string().required(),
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
    async revertManualPayment(req, res, next) {
        const schema = joi_1.default.object({
            commission: joi_1.default.number().required(),
            referenceId: joi_1.default.string().required(),
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
exports.default = new DebtorRequests();
//# sourceMappingURL=debtor.validate.js.map