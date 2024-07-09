import {Document} from 'mongoose';

export interface IRolesPermissions extends Document {
  name: string;
  generalPermissions: {
    createNewCase: boolean;
    importBulkCases: boolean;
    viewUserListing: boolean;
    addNewUser: boolean;
    deleteUser: boolean;
    createAdminUser: boolean;
    viewHomeScreen: boolean;
    viewPaymentsAndAuthorizations: boolean;
    retryPayment: boolean;
    viewCaseDetails: boolean;
    viewClientsForSelf: boolean;
    viewClientsForAllUsers: boolean;
    viewCreditorsForSelf: boolean;
    viewCreditorsForAllUsers: boolean;
  };
  settings: {
    editPaymentsNotificationSettings: boolean;
    editAuthorizationInterval: boolean;
    editRetryInterval: boolean;
    viewNotificationTemplates: boolean;
    viewCustomFields: boolean;
    addNotificationTemplate: boolean;
    editNotificationTemplate: boolean;
    addCustomFields: boolean;
    deleteNotificationTemplate: boolean;
    editCustomFields: boolean;
    deleteCustomFields: boolean;
    viewCaseStatuses: boolean;
    addCaseStatus: boolean;
    editCaseStatus: boolean;
    deleteCaseStatus: boolean;
    viewPipeline: boolean;
    createPipeline: boolean;
    editPipeline: boolean;
    deletePipeline: boolean;
  };
  analytics: {
    viewAnalyticsForSelf: boolean;
    viewAnalyticsForAllusers: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
