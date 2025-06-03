"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const case_validate_1 = __importDefault(require("../../middleware/validators/case.validate"));
const email_controller_1 = __importDefault(require("../controllers/email/email.controller"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024, fieldSize: 50 * 1024 * 1024 },
});
const sendEmailFields = upload.fields([
    { name: 'sendTo' },
    { name: 'from' },
    { name: 'content' },
    { name: 'subject' },
    { name: 'cc' },
    { name: 'files' },
    { name: 'signedUrls' },
]);
router.post('/sendSmsEmailDebtorCreditor/:id', authorize_middleware_1.default.validateAuth, sendEmailFields, case_validate_1.default.sendSmsEmailDebtorCreditor, email_controller_1.default.sendSmsEmailDebtorCreditor); // not in current use
router.post('/sendGridParseEmail', upload.any(), email_controller_1.default.sendGridEmail);
router.get('/getAllLinks', authorize_middleware_1.default.validateAuth, email_controller_1.default.getAllLinks);
router.delete('/deleteLink/:id', authorize_middleware_1.default.validateAuth, email_controller_1.default.linkVerified);
router.post('/threading', authorize_middleware_1.default.validateAuth, email_controller_1.default.emailThreading);
router.get('/eachThreadingMails/:id', authorize_middleware_1.default.validateAuth, email_controller_1.default.eachThreadingMails);
exports.default = router;
//# sourceMappingURL=email.routes.js.map