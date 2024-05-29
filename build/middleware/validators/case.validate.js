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
                        .pattern(/^\d{10,11}$/)
                        .required(),
                    address: joi_1.default.string().required(),
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
                        .pattern(/^\d{10,11}$/)
                        .required(),
                    address: joi_1.default.string().required(),
                }),
                contacts: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\d{10,11}$/)
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
                        .pattern(/^\d{10,11}$/)
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
                        .pattern(/^\d{10,11}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
                    relationWithDebtor: joi_1.default.string().allow(''),
                    country: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                })),
                notes: joi_1.default.string().allow(''),
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
            status: joi_1.default.string().required(),
            intervals: joi_1.default.array().items(joi_1.default.object({
                amount: joi_1.default.number().strict().required(),
                startDate: joi_1.default.date().required(),
                frequency: joi_1.default.number().optional(),
                timePeriod: joi_1.default.string()
                    .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
                    .required(),
            })),
        });
        if (req.query.bulk === 'true') {
            const cases = req.body.cases;
            if (Array.isArray(cases)) {
                for (const tempCase of cases) {
                    const { error } = schema.validate(tempCase);
                    if (error) {
                        return res
                            .status(constants_util_1.default.CODE.BAD_REQUEST)
                            .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
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
                .send(responseHelper_util_1.default.get4xxResponse(error.details[0].message));
        }
    }
}
exports.default = new CaseValidate();
//# sourceMappingURL=case.validate.js.map