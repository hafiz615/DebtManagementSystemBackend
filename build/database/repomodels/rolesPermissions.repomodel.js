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
        this.generalPermissions = {
            createNewCase: false,
            importBulkCases: false,
            viewUserListing: false,
            addNewUser: false,
            deleteUser: false,
            createAdminUser: false,
            viewHomeScreen: false,
            viewPaymentsAndAuthorizations: false,
            retryPayment: false,
            viewCaseDetails: false,
            viewClientsForSelf: false,
            viewClientsForAllUsers: false,
            viewCreditorsForSelf: false,
            viewCreditorsForAllUsers: false,
        };
        this.settings = {
            editPaymentsNotificationSettings: false,
            editAuthorizationInterval: false,
            editRetryInterval: false,
            viewNotificationTemplates: false,
            viewCustomFields: false,
            addNotificationTemplate: false,
            editNotificationTemplate: false,
            addCustomFields: false,
            deleteNotificationTemplate: false,
            editCustomFields: false,
            deleteCustomFields: false,
            viewCaseStatuses: false,
            addCaseStatus: false,
            editCaseStatus: false,
            deleteCaseStatus: false,
            viewPipeline: false,
            createPipeline: false,
            editPipeline: false,
            deletePipeline: false,
        };
        this.analytics = {
            viewAnalyticsForSelf: false,
            viewAnalyticsForAllusers: false,
        };
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.RolesPermissions = RolesPermissions;
//# sourceMappingURL=rolesPermissions.repomodel.js.map