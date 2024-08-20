"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesPermissions = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class RolesPermissions {
    constructor() {
        this.name = '';
        this.createdBy = '';
        this.isDeleted = false;
        this.generalPermissions = {
            createNewCase: true,
            importBulkCases: false,
            viewUserListing: true,
            addNewUser: false,
            deleteUser: false,
            createAdminUser: false,
            viewHomeScreen: true,
            viewPaymentsAndAuthorizations: true,
            retryPayment: false,
            retryCapture: false,
            viewCaseDetails: true,
            viewClientsForSelf: true,
            viewClientsForAllUsers: true,
            viewCreditorsForSelf: true,
            viewCreditorsForAllUsers: true,
        };
        this.settings = {
            editPaymentsNotificationSettings: false,
            editAuthorizationInterval: false,
            editRetryInterval: false,
            viewNotificationTemplates: true,
            viewCustomFields: true,
            addNotificationTemplate: false,
            editNotificationTemplate: false,
            addCustomFields: false,
            deleteNotificationTemplate: false,
            editCustomFields: false,
            deleteCustomFields: false,
            viewCaseStatuses: true,
            addCaseStatus: false,
            editCaseStatus: false,
            deleteCaseStatus: false,
            viewPipeline: true,
            createPipeline: false,
            editPipeline: false,
            deletePipeline: false,
            addRole: false,
            viewRoles: true,
            editRole: false,
            deleteRole: false,
        };
        this.analytics = {
            viewAnalyticsForSelf: true,
            viewAnalyticsForAllusers: true,
        };
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.RolesPermissions = RolesPermissions;
//# sourceMappingURL=rolesPermissions.repomodel.js.map