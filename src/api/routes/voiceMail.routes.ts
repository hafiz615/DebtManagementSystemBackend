import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import voiceMailController from '../controllers/voiceMail/voiceMail.controller';
const router = Router();

router.post('/twilio/voiceMail', voiceMailController.voiceMail);
router.post(
  '/twilio/voiceMailRecording',
  voiceMailController.voiceMailRecording
);

router.get(
  '/getVoiceMails',
  authorize.validateAuth,
  voiceMailController.getVoiceMails
);
export default router;
