import {Router} from 'express';
import emailThreadingController from '../controllers/emailThreading/emailThreading.controller';
import authorize from '../../middleware/authorize.middleware';

const router = Router();

export default router;
