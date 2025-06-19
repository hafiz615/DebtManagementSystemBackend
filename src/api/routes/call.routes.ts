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
router.post(
  '/conference/conference-start-event',
  callController.conferenceStartEvent
);
router.post(
  '/conference/conference-recording-status',
  callController.conferenceRecordingStatus
);

router.post(
  '/conference/add-participant',
  authorize.validateAuth,
  callController.addParticipant
);

router.get('/twilio/token', authorize.validateAuth, callController.getToken);
router.post('/twilio/fallback', callController.callFallBack);
router.post('/twilio/call-status', callController.callStatus);
router.get(
  '/twilio/getIncomingCall/:callSid',
  callController.getIncomingCallSid
);
router.post(
  '/conference/getAllTheParticipants',
  callController.getAllTheParticipants
);

router.post('/callSummary', callController.callSummary);
router.patch(
  '/updateCall/:callSid',
  authorize.validateAuth,
  callController.updateCall
);

router.patch(
  '/updateConferenceParticipant',
  callController.updateConferenceParticipant
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

router.get(
  '/getAllUserNumbers',
  authorize.validateAuth,
  callController.getAllUserNumbers
);

router.post(
  '/twilio/voice-mail-recording-status',
  callController.voiceMailRecordingStatus
);

router.delete(
  '/deleteCall/:id',
  authorize.validateAuth,
  callController.deleteCall
);

router.delete(
  '/conference/removeParticipant',
  callController.removeParticipant
);

router.post(
  '/conference/completeConference',
  callController.completeConference
);

//Telynex

router.post('/telnyx/fallback', callController.telnyxCallFallBack);
router.post('/telnyx/call-status', callController.telnyxCallStatus);
router.post('/telnyxEvents', callController.telnyxEvents);
router.get('/telnyx/token', authorize.validateAuth, callController.telnyxToken);
router.get(
  '/telnyx/phoneNo',
  authorize.validateAuth,
  callController.telnyxPhoneNo
);

export default router;
