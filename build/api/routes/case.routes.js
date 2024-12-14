"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const case_controller_1 = __importDefault(require("../controllers/case/case.controller"));
const case_validate_1 = __importDefault(require("../../middleware/validators/case.validate"));
const router = (0, express_1.Router)();
router.post('/createCase', authorize_middleware_1.default.validateAuth, case_validate_1.default.validateCase, case_controller_1.default.createCase); // not in current use
router.get('/getAllCases', authorize_middleware_1.default.validateAuth, case_controller_1.default.getAllCases);
router.get('/getCaseById/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getCaseById);
router.put('/updateCase/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.updateCase, case_controller_1.default.updateCase);
router.put('/updateCaseAbout/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.validateCaseAbout, case_controller_1.default.updateCaseAbout);
router.delete('/deleteCase/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.deleteCase);
// router.post(
//   '/getSettlementRange/:id',
//   authorize.validateAuth,
//   caseController.getAIIntegrationData
// );
router.post('/getSummary/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getSummary);
router.get('/getAIToken', authorize_middleware_1.default.validateAuth, case_controller_1.default.getAIToken);
router.get('/getCaseSummaries/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getCaseSummaries);
router.post('/getScores/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getScores);
router.post('/getCreditorNames/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getCreditorNames);
router.post('/getSettlementRange/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getSettlementRange);
router.post('/getCreditorHistory', authorize_middleware_1.default.validateAuth, case_controller_1.default.getCreditorHistory);
router.post('/createCreditorsCases/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.validateCreditorsCases, case_controller_1.default.createCreditorsCases);
router.post('/getScoresSettlementRange/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getScoresSettlementRange);
router.post('/addNotes/:id', // note will be added across case id
authorize_middleware_1.default.validateAuth, case_validate_1.default.validateAddNotes, case_controller_1.default.addNotes);
router.post('/getScoresSettlementByCommPercentage/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getScoresSettlementByCommPercentage);
router.post('/getWeeklyAndTotalCommission/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getWeeklyAndTotalCommission);
router.post('/sendSettlementEmail/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.sendEmail, case_controller_1.default.sendSettlementEmail);
router.get('/caseHistory/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.caseHistory);
router.post('/saveJustification', authorize_middleware_1.default.validateAuth, case_validate_1.default.saveJustification, case_controller_1.default.saveJustification);
router.get('/calculateIntervalsAmount/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.calculateIntervalsAmount);
router.get('/getSettlementJustifications/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getSettlementJustifications);
router.delete('/deleteFile/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.deleteFile);
router.post('/updateContractDetails/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.updateContractDetails, case_controller_1.default.updateContractDetails);
router.delete('/deleteCreditor/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.deleteCreditor);
router.post('/createCall/:id', case_controller_1.default.createCall);
router.get('/getCalls/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getCalls);
router.post('/twilio/voice', case_controller_1.default.callTwiml);
router.post('/twilio/transcription-status', case_controller_1.default.callTranscriptionStatus);
router.post('/twilio/recording-status', case_controller_1.default.callRecordingStatus);
router.post('/twilio/call-hangup/:callSid', case_controller_1.default.callHangUp);
exports.default = router;
//# sourceMappingURL=case.routes.js.map