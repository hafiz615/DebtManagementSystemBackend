import mongoose, {Schema} from 'mongoose';
import {
  INotificationConfiguration,
  INotificationUserPermission,
} from '../interfaces/notificationConfiguration.interface';
import asyncLocalStorage from '../../utils/localStorage.util';
import UpdateLog from './updateLogs.model';

const NotificationConfigurationModel: Schema = new Schema({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  userPermission: Array<INotificationUserPermission>(),
  isDeleted: {type: Boolean},
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

NotificationConfigurationModel.index({_id: 1, email: 1});

const logUpdate = async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate();
  // Retrieve the document before update
  const previousDoc = await this.model.findOne(query);
  this.previousDoc = previousDoc;
  next();
};

const logUpdatePost = async function (doc) {
  let traceId = '';
  const store = asyncLocalStorage.getStore();
  if (store) {
    traceId = store.get('traceId');
  }
  const previousDoc = this.previousDoc;
  const logEntry = new UpdateLog({
    traceId: traceId,
    previousData: previousDoc,
    currentData: doc,
    model: this.model.modelName,
  });
  logEntry.save().catch(err => {
    console.error('Error saving log entry', err);
  });
};

NotificationConfigurationModel.pre('findOneAndUpdate', logUpdate);
NotificationConfigurationModel.pre('updateMany', logUpdate);
NotificationConfigurationModel.pre('updateOne', logUpdate);

NotificationConfigurationModel.post('findOneAndUpdate', logUpdatePost);
NotificationConfigurationModel.post('updateMany', logUpdatePost);
NotificationConfigurationModel.post('updateOne', logUpdatePost);

export const NotificationConfiguration =
  mongoose.model<INotificationConfiguration>(
    'NotificationConfiguration',
    NotificationConfigurationModel
  );
