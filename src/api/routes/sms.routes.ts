import {Router} from 'express';
import smsController from '../controllers/sms/sms.controller';
import authorize from '../../middleware/authorize.middleware';

const router = Router();
router.post('/sms', smsController.receiveMessage);
router.post('/sms-fallback', smsController.smsFallBack);

router.post(
  '/saveCaseDetailNotification',
  authorize.validateAuth,
  smsController.saveCaseDetailNotification
);

export default router;
