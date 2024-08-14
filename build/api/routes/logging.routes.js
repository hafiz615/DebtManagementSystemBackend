"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const logging_controller_1 = __importDefault(require("../controllers/logging/logging.controller"));
logging_controller_1.default;
const router = (0, express_1.Router)();
router.get('/getLogsByTraceId/:id', authorize_middleware_1.default.validateAuth, logging_controller_1.default.getLogsByTraceId);
router.get('/getLogsByTrackingId/:id', authorize_middleware_1.default.validateAuth, logging_controller_1.default.getLogsByTrackingId);
exports.default = router;
//# sourceMappingURL=logging.routes.js.map