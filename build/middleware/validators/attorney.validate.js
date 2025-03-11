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
class CaseValidate {
    async getLawSuitBalanceSummary(req, res, next) {
        const schema = joi_1.default.object({
            caseId: joi_1.default.string().required().messages({
                'any.required': 'Case ID is required.',
                'string.empty': 'Case ID cannot be empty.',
                'string.base': 'Case ID must be a string.',
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
    async cancelLawSuitPaymentPlan(req, res, next) {
        const schema = joi_1.default.object({
            caseId: joi_1.default.string().required().messages({
                'any.required': 'Case ID is required.',
                'string.empty': 'Case ID cannot be empty.',
                'string.base': 'Case ID must be a string.',
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
//# sourceMappingURL=attorney.validate.js.map