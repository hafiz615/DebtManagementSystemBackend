import {Document} from 'mongoose';
import commonUtil from '../../utils/common.util';

export class RolesPermissions {
  name = '';
  createdBy = '';
  generalPermissions = {
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
  settings = {
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
  analytics = {
    viewAnalyticsForSelf: false,
    viewAnalyticsForAllusers: false,
  };
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
