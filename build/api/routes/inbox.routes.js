"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inbox_controller_1 = __importDefault(require("../controllers/inbox/inbox.controller"));
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const router = (0, express_1.Router)();
router.get('/getAllMessages', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.getAllMessages);
router.put('/markAsRead/:id', authorize_middleware_1.default.validateAuth, inbox_controller_1.default.markAsRead);
exports.default = router;
//# sourceMappingURL=inbox.routes.js.map