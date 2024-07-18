import {Document} from 'mongoose';
import commonUtil from '../../utils/common.util';

export class RolesPermissions {
  name = '';
  createdBy = '';
  isDeleted = false;
  generalPermissions = {
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
  settings = {
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
  analytics = {
    viewAnalyticsForSelf: true,
    viewAnalyticsForAllusers: true,
  };
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
