"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
//import inboxController from '../controllers/inbox/inbox.controller';
const draft_controller_1 = __importDefault(require("../controllers/draft/draft.controller"));
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const router = (0, express_1.Router)();
router.post('/getAllDraftMessages', authorize_middleware_1.default.validateAuth, draft_controller_1.default.getAllDraftMessages);
router.post('/createEmailDraft/:caseId', authorize_middleware_1.default.validateAuth, draft_controller_1.default.createEmailDraft);
exports.default = router;
//# sourceMappingURL=draft.route.js.map