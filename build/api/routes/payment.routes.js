"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const payment_controller_1 = __importDefault(require("../controllers/payment/payment.controller"));
const router = (0, express_1.Router)();
router.get('/getHomePayments', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getHomePayments);
router.get('/getCaseUpcomingPayments/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getCaseUpcomingPayments);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map