import {Application} from 'express';
import userRouter from './user.routes';
import caseRouter from './case.routes';
import uploadFileRouter from './upload.routes';


export default function setup(app: Application) {
  app.use('/api/v1/user', userRouter);
  app.use('/api/v1/case', caseRouter);
  app.use('/api/v1/upload', uploadFileRouter);
}
