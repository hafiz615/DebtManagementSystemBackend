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
                    fullName: joi_1.default.string().required(),
                    email: joi_1.default.string().email().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                }),
                businessInformation: joi_1.default.object({
                    companyName: joi_1.default.string().required(),
                    businessCategory: joi_1.default.string().allow(''),
                }),
                accountTitle: joi_1.default.string().optional().allow('', null),
                contact: joi_1.default.object({
                    name: joi_1.default.string().required(),
                    title: joi_1.default.string().required(),
                    phone: joi_1.default.string()
                        .pattern(/^\+\d{11}$/)
                        .required(),
                    email: joi_1.default.string().email().required(),
                    relationWithCreditor: joi_1.default.string().allow(''),
                    state: joi_1.default.string().allow(''),
                    city: joi_1.default.string().allow(''),
                    zipCode: joi_1.default.string().allow(''),
                    _id: joi_1.default.string().optional(),
                }),
                paymentToken: joi_1.default.string().optional().allow(''),
                paymentType: joi_1.default.string().optional().allow(''),
                paynoteSourceId: joi_1.default.string().optional().allow(''),
                paynoteUserId: joi_1.default.string().optional().allow(''),
                lastFundedDate: joi_1.default.date().optional().allow(''),
                historicalRange: joi_1.default.object({
                    minimum: joi_1.default.number().strict().optional(),
                    maximum: joi_1.default.number().strict().optional(),
                })
                    .optional()
                    .allow(null),
                aggression: joi_1.default.number().optional().min(0).max(10),
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
}
exports.default = new CreditorRequests();
//# sourceMappingURL=creditor.validate.js.map