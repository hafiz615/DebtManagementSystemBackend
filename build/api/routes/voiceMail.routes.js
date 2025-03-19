"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const voiceMail_controller_1 = __importDefault(require("../controllers/voiceMail/voiceMail.controller"));
const router = (0, express_1.Router)();
router.post('/twilio/voiceMail', voiceMail_controller_1.default.voiceMail);
router.post('/twilio/voiceMailRecording', voiceMail_controller_1.default.voiceMailRecording);
router.get('/getVoiceMails', authorize_middleware_1.default.validateAuth, voiceMail_controller_1.default.getVoiceMails);
exports.default = router;
//# sourceMappingURL=voiceMail.routes.js.map