"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const case_validate_1 = __importDefault(require("../../middleware/validators/case.validate"));
const email_controller_1 = __importDefault(require("../controllers/email/email.controller"));
const router = (0, express_1.Router)();
router.post('/sendSmsEmailDebtorCreditor/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.sendSmsEmailDebtorCreditor, email_controller_1.default.sendSmsEmailDebtorCreditor); // not in current use
exports.default = router;
//# sourceMappingURL=email.routes.js.map