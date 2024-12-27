"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const seemlesschex_controller_1 = __importDefault(require("../controllers/seemlesschex/seemlesschex.controller"));
const seemlesschex_validate_1 = __importDefault(require("../../middleware/validators/seemlesschex.validate"));
const router = (0, express_1.Router)();
router.post('/createCheck', authorize_middleware_1.default.validateAuth, seemlesschex_validate_1.default.createCheck, seemlesschex_controller_1.default.createCheck);
router.post('/createPaymentLink', seemlesschex_validate_1.default.createPaymentLink, seemlesschex_controller_1.default.createPaymentLink);
exports.default = router;
//# sourceMappingURL=seemlesschex.route.js.map