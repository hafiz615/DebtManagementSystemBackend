import {Router} from 'express';
import smsController from '../controllers/sms/sms.controller';
const router = Router();
router.post('/sms', smsController.receiveMessage);
router.post('/sms-fallback', smsController.smsFallBack);

export default router;
