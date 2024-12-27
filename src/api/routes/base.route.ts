import {Application} from 'express';
import userRouter from './user.routes';
import caseRouter from './case.routes';
import uploadFileRouter from './upload.routes';
import debtorRouter from './debtor.routes';
import creditorRouter from './creditor.routes';
import paymentRouter from './payment.routes';
import settingsRouter from './settings.routes';
import pipelineStatusRouter from './pipelineStatus.routes';
import statusRouter from './status.routes';
import rolesPermissionsRouter from './rolesPermissions.routes';
import tasksRouter from './tasks.routes';
import loggingRouter from './logging.routes';
import emailRouter from './email.routes';
import bulkUploadRouter from './bulkUpload.route';
import inboxRouter from './inbox.routes';
import notificationRouter from './notification.routes';
import seemlesschexRouter from './seemlesschex.route';

export default function setup(app: Application) {
  app.use('/api/v1/user', userRouter);
  app.use('/api/v1/case', caseRouter);
  app.use('/api/v1/upload', uploadFileRouter);
  app.use('/api/v1/debtor', debtorRouter);
  app.use('/api/v1/creditor', creditorRouter);
  app.use('/api/v1/payment', paymentRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/pipeline', pipelineStatusRouter);
  app.use('/api/v1/status', statusRouter);
  app.use('/api/v1/roles', rolesPermissionsRouter);
  app.use('/api/v1/task', tasksRouter);
  app.use('/api/v1/logs', loggingRouter);
  app.use('/api/v1/email', emailRouter);
  app.use('/api/v1/bulk', bulkUploadRouter);
  app.use('/api/v1/inbox', inboxRouter);
  app.use('/api/v1/notification', notificationRouter);
  app.use('/api/v1/seemlesschex', seemlesschexRouter);
}
