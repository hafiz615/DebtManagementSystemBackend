"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = __importDefault(require("../controllers/notification/notification.controller"));
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const router = (0, express_1.Router)();
router.post('/getAllNotifications', authorize_middleware_1.default.validateAuth, notification_controller_1.default.getAllNotifications);
router.put('/markAsRead/:id', authorize_middleware_1.default.validateAuth, notification_controller_1.default.markAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map