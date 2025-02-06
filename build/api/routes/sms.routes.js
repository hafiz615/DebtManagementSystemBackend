"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sms_controller_1 = __importDefault(require("../controllers/sms/sms.controller"));
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const router = (0, express_1.Router)();
router.post('/sms', sms_controller_1.default.receiveMessage);
router.post('/sms-fallback', sms_controller_1.default.smsFallBack);
router.post('/saveCaseDetailNotification', authorize_middleware_1.default.validateAuth, sms_controller_1.default.saveCaseDetailNotification);
exports.default = router;
//# sourceMappingURL=sms.routes.js.map