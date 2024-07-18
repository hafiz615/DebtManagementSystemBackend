import mongoose, {Schema} from 'mongoose';
import {IRolesPermissions} from '../interfaces/rolesPermissions.interface';

const rolesPermissionsModel = new Schema({
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
  },
  generalPermissions: {
    createNewCase: {
      type: Boolean,
    },
    importBulkCases: {
      type: Boolean,
    },
    viewUserListing: {
      type: Boolean,
    },
    addNewUser: {
      type: Boolean,
    },
    deleteUser: {
      type: Boolean,
    },
    createAdminUser: {
      type: Boolean,
    },
    viewHomeScreen: {
      type: Boolean,
    },
    viewPaymentsAndAuthorizations: {
      type: Boolean,
    },
    retryPayment: {
      type: Boolean,
    },
    retryCapture: {
      type: Boolean,
    },
    viewCaseDetails: {
      type: Boolean,
    },
    viewClientsForSelf: {
      type: Boolean,
    },
    viewClientsForAllUsers: {
      type: Boolean,
    },
    viewCreditorsForSelf: {
      type: Boolean,
    },
    viewCreditorsForAllUsers: {
      type: Boolean,
    },
  },
  settings: {
    editPaymentsNotificationSettings: {
      type: Boolean,
    },
    editAuthorizationInterval: {
      type: Boolean,
    },
    editRetryInterval: {
      type: Boolean,
    },
    viewNotificationTemplates: {
      type: Boolean,
    },
    viewCustomFields: {
      type: Boolean,
    },
    addNotificationTemplate: {
      type: Boolean,
    },
    editNotificationTemplate: {
      type: Boolean,
    },
    addCustomFields: {
      type: Boolean,
    },
    deleteNotificationTemplate: {
      type: Boolean,
    },
    editCustomFields: {
      type: Boolean,
    },
    deleteCustomFields: {
      type: Boolean,
    },
    viewCaseStatuses: {
      type: Boolean,
    },
    addCaseStatus: {
      type: Boolean,
    },
    editCaseStatus: {
      type: Boolean,
    },
    deleteCaseStatus: {
      type: Boolean,
    },
    viewPipeline: {
      type: Boolean,
    },
    createPipeline: {
      type: Boolean,
    },
    editPipeline: {
      type: Boolean,
    },
    deletePipeline: {
      type: Boolean,
    },
    addRole: {
      type: Boolean,
    },
    editRole: {
      type: Boolean,
    },
    viewRoles: {
      type: Boolean,
    },
    deleteRole: {
      type: Boolean,
    },
  },
  analytics: {
    viewAnalyticsForSelf: {
      type: Boolean,
    },
    viewAnalyticsForAllusers: {
      type: Boolean,
    },
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

export const RolesPermissions = mongoose.model<IRolesPermissions>(
  'RolesPermissions',
  rolesPermissionsModel
);
