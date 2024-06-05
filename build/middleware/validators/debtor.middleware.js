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
                        .pattern(/^\+\d{10}$/)
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
                        .pattern(/^\+\d{10}$/)
                        .required(),
                    address: joi_1.default.string().required(),
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
}
exports.default = new DebtorRequests();
//# sourceMappingURL=debtor.middleware.js.map