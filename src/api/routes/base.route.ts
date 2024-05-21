import {Application} from 'express';
import userRouter from './user.routes';
import caseRouter from './case.routes';
import uploadFileRouter from './upload.routes';
import debtorRouter from './debtor.routes';
import creditorRouter from './creditor.routes';
import paymentRouter from './payment.routes';
import settingsRouter from './settings.routes';

export default function setup(app: Application) {
  app.use('/api/v1/user', userRouter);
  app.use('/api/v1/case', caseRouter);
  app.use('/api/v1/upload', uploadFileRouter);
  app.use('/api/v1/debtor', debtorRouter);
  app.use('/api/v1/creditor', creditorRouter);
  app.use('/api/v1/payment', paymentRouter);
  app.use('/api/v1/settings', settingsRouter);
}
