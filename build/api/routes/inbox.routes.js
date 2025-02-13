"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inbox_controller_1 = __importDefault(require("../controllers/inbox/inbox.controller"));
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const draftEmailFields = upload.fields([
    { name: 'sendTo' },
    { name: 'from' },
    { name: 'caseId' },
    { name: 'content' },
    { name: 'subject' },
    { name: 'cc' },
    { name: 'files' },
]);
const router = (0, express_1.Router)();
router.post('/getAllMessages', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.getAllMessages);
router.put('/markAsRead/:id', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.markAsRead);
router.post('/createEmailDraft', authorize_middleware_1.default.validateAuth, draftEmailFields, inbox_controller_1.default.createEmailDraft);
router.delete('/deleteDraftEmail/:id', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.deleteDraftEmail);
router.put('/updateDraftEmail/:id', authorize_middleware_1.default.validateAuth, draftEmailFields, inbox_controller_1.default.updateDraftEmail);
router.post('/createDraft', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.createDraft);
router.delete('/deleteDraft/:id', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.deleteDraftEmail);
router.put('/updateDraft/:id', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.updateDraftSms);
router.put('/inboxStatus/:id', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.inboxStatus);
exports.default = router;
//# sourceMappingURL=inbox.routes.js.map