"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sms_controller_1 = __importDefault(require("../controllers/sms/sms.controller"));
const router = (0, express_1.Router)();
router.post('/sms', sms_controller_1.default.receiveMessage);
router.post('/sms-fallback', sms_controller_1.default.smsFallBack);
exports.default = router;
//# sourceMappingURL=sms.routes.js.map