"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const creditor_controller_1 = __importDefault(require("../controllers/creditor/creditor.controller"));
const router = (0, express_1.Router)();
router.post('/getCreditor', authorize_middleware_1.default.validateAuth, creditor_controller_1.default.getCreditor);
exports.default = router;
//# sourceMappingURL=creditor.routes.js.map