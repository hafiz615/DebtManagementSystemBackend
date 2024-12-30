import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
//import caseController from '../controllers/case/case.controller';
import callController from '../controllers/call/call.controller';
const router = Router();

router.get('/getCalls/:caseId', authorize.validateAuth, callController.getCalls);
router.post('/voice', callController.callTwiml);
//router.post('/twilio/transcription-status', caseController.callTranscriptionStatus);
router.post('/twilio/recording-status', callController.callRecordingStatus);
//router.post('/twilio/call-hangup/:callSid', caseController.callHangUp);
router.get('/twilio/token', callController.getToken);
router.post('/twilio/fallback', callController.callFallBack);
router.post('/twilio/call-status', callController.callStatus);

export default router;