import mongoose, {Schema} from 'mongoose';
import {IRolesPermissions} from '../interfaces/rolesPermissions.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';
import {v4} from 'uuid';

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
  logTrackingId: {
    type: String,
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

rolesPermissionsModel.pre('save', async function (next) {
  this.logTrackingId = v4();
  next();
});

const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
  // Retrieve the document before update
  const previousDoc = await this.model.findOne(query);
  this.previousDoc = previousDoc;
  next();
};

const logUpdatePost = async function (doc) {
  let traceId = '',
    ip = '',
    userId = '',
    url = '',
    method = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    if (store.get('traceId')) traceId = store.get('traceId');
    if (store.get('ip')) ip = store.get('ip');
    if (store.get('userId')) userId = store.get('userId');
    if (store.get('url')) url = store.get('url');
    if (store.get('method')) method = store.get('method');
  }
  const previousDoc = this.previousDoc;
  const logEntry = new UpdateLog({
    traceId,
    previousData: previousDoc,
    currentData: doc,
    model: this.model.modelName,
    logTrackingId: previousDoc.logTrackingId,
    ip,
    userId,
    url,
    method,
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

rolesPermissionsModel.pre('findOneAndUpdate', logUpdate);
rolesPermissionsModel.pre('updateMany', logUpdate);
rolesPermissionsModel.pre('updateOne', logUpdate);

rolesPermissionsModel.post('findOneAndUpdate', logUpdatePost);
rolesPermissionsModel.post('updateMany', logUpdatePost);
rolesPermissionsModel.post('updateOne', logUpdatePost);

export const RolesPermissions = mongoose.model<IRolesPermissions>(
  'RolesPermissions',
  rolesPermissionsModel
);
