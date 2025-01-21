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
            name: joi_1.default.string().messages({
                'string.base': 'Name must be a string.',
            }),
            createdBy: joi_1.default.string().optional().messages({
                'string.base': 'Created By must be a string.',
            }),
            generalPermissions: joi_1.default.object({
                createNewCase: joi_1.default.boolean().messages({
                    'boolean.base': 'Create new case permission must be a boolean.',
                }),
                importBulkCases: joi_1.default.boolean().messages({
                    'boolean.base': 'Import bulk cases permission must be a boolean.',
                }),
                viewUserListing: joi_1.default.boolean().messages({
                    'boolean.base': 'View user listing permission must be a boolean.',
                }),
                addNewUser: joi_1.default.boolean().messages({
                    'boolean.base': 'Add new user permission must be a boolean.',
                }),
                deleteUser: joi_1.default.boolean().messages({
                    'boolean.base': 'Delete user permission must be a boolean.',
                }),
                createAdminUser: joi_1.default.boolean().messages({
                    'boolean.base': 'Create admin user permission must be a boolean.',
                }),
                viewHomeScreen: joi_1.default.boolean().messages({
                    'boolean.base': 'View home screen permission must be a boolean.',
                }),
                viewPaymentsAndAuthorizations: joi_1.default.boolean().messages({
                    'boolean.base': 'View payments and authorizations permission must be a boolean.',
                }),
                retryPayment: joi_1.default.boolean().messages({
                    'boolean.base': 'Retry payment permission must be a boolean.',
                }),
                retryCapture: joi_1.default.boolean().messages({
                    'boolean.base': 'Retry capture permission must be a boolean.',
                }),
                viewCaseDetails: joi_1.default.boolean().messages({
                    'boolean.base': 'View case details permission must be a boolean.',
                }),
                viewClientsForSelf: joi_1.default.boolean().messages({
                    'boolean.base': 'View clients for self permission must be a boolean.',
                }),
                viewClientsForAllUsers: joi_1.default.boolean().messages({
                    'boolean.base': 'View clients for all users permission must be a boolean.',
                }),
                viewCreditorsForSelf: joi_1.default.boolean().messages({
                    'boolean.base': 'View creditors for self permission must be a boolean.',
                }),
                viewCreditorsForAllUsers: joi_1.default.boolean().messages({
                    'boolean.base': 'View creditors for all users permission must be a boolean.',
                }),
            }),
            settings: joi_1.default.object({
                editPaymentsNotificationSettings: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit payments notification settings permission must be a boolean.',
                }),
                editAuthorizationInterval: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit authorization interval permission must be a boolean.',
                }),
                editRetryInterval: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit retry interval permission must be a boolean.',
                }),
                viewNotificationTemplates: joi_1.default.boolean().messages({
                    'boolean.base': 'View notification templates permission must be a boolean.',
                }),
                viewCustomFields: joi_1.default.boolean().messages({
                    'boolean.base': 'View custom fields permission must be a boolean.',
                }),
                addNotificationTemplate: joi_1.default.boolean().messages({
                    'boolean.base': 'Add notification template permission must be a boolean.',
                }),
                editNotificationTemplate: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit notification template permission must be a boolean.',
                }),
                addCustomFields: joi_1.default.boolean().messages({
                    'boolean.base': 'Add custom fields permission must be a boolean.',
                }),
                deleteNotificationTemplate: joi_1.default.boolean().messages({
                    'boolean.base': 'Delete notification template permission must be a boolean.',
                }),
                editCustomFields: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit custom fields permission must be a boolean.',
                }),
                deleteCustomFields: joi_1.default.boolean().messages({
                    'boolean.base': 'Delete custom fields permission must be a boolean.',
                }),
                viewCaseStatuses: joi_1.default.boolean().messages({
                    'boolean.base': 'View case statuses permission must be a boolean.',
                }),
                addCaseStatus: joi_1.default.boolean().messages({
                    'boolean.base': 'Add case status permission must be a boolean.',
                }),
                editCaseStatus: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit case status permission must be a boolean.',
                }),
                deleteCaseStatus: joi_1.default.boolean().messages({
                    'boolean.base': 'Delete case status permission must be a boolean.',
                }),
                viewPipeline: joi_1.default.boolean().messages({
                    'boolean.base': 'View pipeline permission must be a boolean.',
                }),
                createPipeline: joi_1.default.boolean().messages({
                    'boolean.base': 'Create pipeline permission must be a boolean.',
                }),
                editPipeline: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit pipeline permission must be a boolean.',
                }),
                deletePipeline: joi_1.default.boolean().messages({
                    'boolean.base': 'Delete pipeline permission must be a boolean.',
                }),
                addRole: joi_1.default.boolean().messages({
                    'boolean.base': 'Add role permission must be a boolean.',
                }),
                viewRoles: joi_1.default.boolean().messages({
                    'boolean.base': 'View roles permission must be a boolean.',
                }),
                editRole: joi_1.default.boolean().messages({
                    'boolean.base': 'Edit role permission must be a boolean.',
                }),
                deleteRole: joi_1.default.boolean().messages({
                    'boolean.base': 'Delete role permission must be a boolean.',
                }),
            }),
            analytics: joi_1.default.object({
                viewAnalyticsForSelf: joi_1.default.boolean().messages({
                    'boolean.base': 'View analytics for self permission must be a boolean.',
                }),
                viewAnalyticsForAllusers: joi_1.default.boolean().messages({
                    'boolean.base': 'View analytics for all users permission must be a boolean.',
                }),
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
exports.default = new CustomFieldRequest();
//# sourceMappingURL=rolesPermissions.validate.js.map