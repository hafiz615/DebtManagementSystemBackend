"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../utils/responseHelper.util"));
const joi_1 = __importDefault(require("joi"));
class CustomFieldRequest {
    async role(req, res, next) {
        const schema = joi_1.default.object({
            name: joi_1.default.string(),
            createdBy: joi_1.default.string().optional(),
            generalPermissions: joi_1.default.object({
                createNewCase: joi_1.default.boolean(),
                importBulkCases: joi_1.default.boolean(),
                viewUserListing: joi_1.default.boolean(),
                addNewUser: joi_1.default.boolean(),
                deleteUser: joi_1.default.boolean(),
                createAdminUser: joi_1.default.boolean(),
                viewHomeScreen: joi_1.default.boolean(),
                viewPaymentsAndAuthorizations: joi_1.default.boolean(),
                retryPayment: joi_1.default.boolean(),
                viewCaseDetails: joi_1.default.boolean(),
                viewClientsForSelf: joi_1.default.boolean(),
                viewClientsForAllUsers: joi_1.default.boolean(),
                viewCreditorsForSelf: joi_1.default.boolean(),
                viewCreditorsForAllUsers: joi_1.default.boolean(),
            }),
            settings: joi_1.default.object({
                editPaymentsNotificationSettings: joi_1.default.boolean(),
                editAuthorizationInterval: joi_1.default.boolean(),
                editRetryInterval: joi_1.default.boolean(),
                viewNotificationTemplates: joi_1.default.boolean(),
                viewCustomFields: joi_1.default.boolean(),
                addNotificationTemplate: joi_1.default.boolean(),
                editNotificationTemplate: joi_1.default.boolean(),
                addCustomFields: joi_1.default.boolean(),
                deleteNotificationTemplate: joi_1.default.boolean(),
                editCustomFields: joi_1.default.boolean(),
                deleteCustomFields: joi_1.default.boolean(),
                viewCaseStatuses: joi_1.default.boolean(),
                addCaseStatus: joi_1.default.boolean(),
                editCaseStatus: joi_1.default.boolean(),
                deleteCaseStatus: joi_1.default.boolean(),
                viewPipeline: joi_1.default.boolean(),
                createPipeline: joi_1.default.boolean(),
                editPipeline: joi_1.default.boolean(),
                deletePipeline: joi_1.default.boolean(),
            }),
            analytics: joi_1.default.object({
                viewAnalyticsForSelf: joi_1.default.boolean(),
                viewAnalyticsForAllusers: joi_1.default.boolean(),
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
    }
}
exports.default = new CustomFieldRequest();
//# sourceMappingURL=rolesPermissions.validate.js.map