"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const call_controller_1 = __importDefault(require("../controllers/call/call.controller"));
const router = (0, express_1.Router)();
router.get('/getCalls/:caseId', authorize_middleware_1.default.validateAuth, call_controller_1.default.getCalls);
router.post('/voice', call_controller_1.default.callTwiml);
router.post('/twilio/recording-status', call_controller_1.default.callRecordingStatus);
router.get('/twilio/token', authorize_middleware_1.default.validateAuth, call_controller_1.default.getToken);
router.post('/twilio/fallback', call_controller_1.default.callFallBack);
router.post('/twilio/call-status', call_controller_1.default.callStatus);
router.post('/callSummary', call_controller_1.default.callSummary);
router.patch('/updateCall/:callSid', authorize_middleware_1.default.validateAuth, call_controller_1.default.updateCall);
exports.default = router;
//# sourceMappingURL=call.routes.js.map