import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import caseController from '../controllers/case/case.controller';
import caseValidate from '../../middleware/validators/case.validate';
const router = Router();
router.post(
  '/createCase',
  authorize.validateAuth,
  caseValidate.validateCase,
  caseController.createCase
); // not in current use

router.get('/getAllCases', authorize.validateAuth, caseController.getAllCases);
router.get(
  '/getCaseById/:id',
  authorize.validateAuth,
  caseController.getCaseById
);
router.put(
  '/updateCase/:id',
  authorize.validateAuth,
  caseValidate.updateCase,
  caseController.updateCase
);
router.put(
  '/updateCaseAbout/:id',
  authorize.validateAuth,
  caseValidate.validateCaseAbout,
  caseController.updateCaseAbout
);
router.delete(
  '/deleteCase/:id',
  authorize.validateAuth,
  caseController.deleteCase
);
// router.post(
//   '/getSettlementRange/:id',
//   authorize.validateAuth,
//   caseController.getAIIntegrationData
// );

router.post(
  '/getSummary/:id',
  authorize.validateAuth,
  caseController.getSummary
);

router.get('/getAIToken', authorize.validateAuth, caseController.getAIToken);

router.get(
  '/getCaseSummaries/:id',
  authorize.validateAuth,
  caseController.getCaseSummaries
);
router.post('/getScores/:id', authorize.validateAuth, caseController.getScores);
router.post(
  '/getCreditorNames/:id',
  authorize.validateAuth,
  caseController.getCreditorNames
);
router.post(
  '/getSettlementRange/:id',
  authorize.validateAuth,
  caseController.getSettlementRange
);
router.post(
  '/getCreditorHistory',
  authorize.validateAuth,
  caseController.getCreditorHistory
);

router.post(
  '/createCreditorsCases/:id',
  authorize.validateAuth,
  caseValidate.validateCreditorsCases,
  caseController.createCreditorsCases
);

router.post(
  '/getScoresSettlementRange/:id',
  authorize.validateAuth,
  caseController.getScoresSettlementRange
);

router.post(
  '/addNotes/:id', // note will be added across case id
  authorize.validateAuth,
  caseValidate.validateAddNotes,
  caseController.addNotes
);

router.post(
  '/getScoresSettlementByCommPercentage/:id',
  authorize.validateAuth,
  caseController.getScoresSettlementByCommPercentage
);

router.post(
  '/getWeeklyAndTotalCommission/:id',
  authorize.validateAuth,
  caseController.getWeeklyAndTotalCommission
);

router.post(
  '/sendSettlementEmail/:id',
  authorize.validateAuth,
  caseValidate.sendEmail,
  caseController.sendSettlementEmail
);

router.get(
  '/caseHistory/:id',
  authorize.validateAuth,
  caseController.caseHistory
);

router.post(
  '/saveJustification',
  authorize.validateAuth,
  caseValidate.saveJustification,
  caseController.saveJustification
);

router.get(
  '/calculateIntervalsAmount/:id',
  authorize.validateAuth,
  caseController.calculateIntervalsAmount
);

router.get(
  '/getSettlementJustifications/:id',
  authorize.validateAuth,
  caseController.getSettlementJustifications
);

router.delete(
  '/deleteFile/:id',
  authorize.validateAuth,
  caseController.deleteFile
);

router.post(
  '/updateContractDetails/:id',
  authorize.validateAuth,
  caseValidate.updateContractDetails,
  caseController.updateContractDetails
);
router.delete(
  '/deleteCreditor/:id',
  authorize.validateAuth,
  caseController.deleteCreditor
);
//router.post('/createCall/:id', caseController.createCall);
router.get('/getCalls/:id', authorize.validateAuth, caseController.getCalls);
router.post('/voice', caseController.callTwiml);
//router.post('/twilio/transcription-status', caseController.callTranscriptionStatus);
router.post('/twilio/recording-status', caseController.callRecordingStatus);
//router.post('/twilio/call-hangup/:callSid', caseController.callHangUp);
router.get('/twilio/token', caseController.getToken);
router.post('/twilio/fallback', caseController.callFallBack);
router.post('/twilio/call-status', caseController.callStatus);

router.put(
  '/updateCasePlan/:id',
  authorize.validateAuth,
  caseValidate.updateCasePlan,
  caseController.updateCasePlan
);

export default router;
