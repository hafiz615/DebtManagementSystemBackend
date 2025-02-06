import {Router} from 'express';
import smsController from '../controllers/sms/sms.controller';
import authorize from '../../middleware/authorize.middleware';
import smsValidate from '../../middleware/validators/sms.validate';

const router = Router();
router.post('/sms', smsController.receiveMessage);
router.post('/sms-fallback', smsController.smsFallBack);

router.post(
  '/saveCaseDetailNotification',
  authorize.validateAuth,
  smsValidate.saveCaseDetailNotification,
  smsController.saveCaseDetailNotification
);

export default router;
