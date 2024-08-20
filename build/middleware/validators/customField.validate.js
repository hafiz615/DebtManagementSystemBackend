"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class CustomFieldRequest {
    async addCustomField(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required(),
            type: joi_1.default.string().valid('date', 'number', 'text').required(),
            description: joi_1.default.string(),
            target: joi_1.default.string().valid('case').required(),
            shared: joi_1.default.boolean(),
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
exports.default = new CustomFieldRequest();
//# sourceMappingURL=customField.validate.js.map