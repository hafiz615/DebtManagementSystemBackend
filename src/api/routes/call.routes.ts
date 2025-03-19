import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import callController from '../controllers/call/call.controller';
const router = Router();

router.get(
  '/getCalls/:caseId',
  authorize.validateAuth,
  callController.getCalls
);
router.post('/voice', callController.callTwiml);
router.post('/twilio/recording-status', callController.callRecordingStatus);
router.get('/twilio/token', authorize.validateAuth, callController.getToken);
router.post('/twilio/fallback', callController.callFallBack);
router.post('/twilio/call-status', callController.callStatus);
router.get(
  '/twilio/getIncomingCall/:callSid',
  callController.getIncomingCallSid
);
router.post('/callSummary', callController.callSummary);
router.patch(
  '/updateCall/:callSid',
  authorize.validateAuth,
  callController.updateCall
);
router.post(
  '/twilio/callerName',
  authorize.validateAuth,
  callController.callerName
);

router.get(
  '/twilio/getNumberMissedCalls',
  authorize.validateAuth,
  callController.getMissedCalls
);

router.post('/twilio/voiceMail', callController.voiceMail);
router.post('/twilio/voiceMailRecording', callController.voiceMailRecording);

router.get(
  '/getVoiceMails',
  authorize.validateAuth,
  callController.getVoiceMails
);

export default router;
