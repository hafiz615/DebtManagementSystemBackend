import {Application} from 'express';
import userRouter from './user.routes';

export default function setup(app: Application) {
  app.use('/api/v1/user', userRouter);
}
