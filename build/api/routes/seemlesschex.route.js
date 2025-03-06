"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const seemlesschex_controller_1 = __importDefault(require("../controllers/seemlesschex/seemlesschex.controller"));
const seemlesschex_validate_1 = __importDefault(require("../../middleware/validators/seemlesschex.validate"));
const payment_validate_1 = __importDefault(require("../../middleware/validators/payment.validate"));
const payment_controller_1 = __importDefault(require("../controllers/payment/payment.controller"));
const router = (0, express_1.Router)();
router.post('/createCheck', authorize_middleware_1.default.validateAuth, seemlesschex_validate_1.default.createCheck, seemlesschex_controller_1.default.createCheck);
router.post('/createPaymentLink', seemlesschex_validate_1.default.createPaymentLink, seemlesschex_controller_1.default.createPaymentLink);
router.post('/updateCheck/:id', authorize_middleware_1.default.validateAuth, seemlesschex_validate_1.default.updateCheck, seemlesschex_controller_1.default.updateCheck);
router.delete('/voidCheck/:id', authorize_middleware_1.default.validateAuth, seemlesschex_validate_1.default.voidCheck, seemlesschex_controller_1.default.voidCheck);
router.get('/getClientChecks/:id', authorize_middleware_1.default.validateAuth, seemlesschex_controller_1.default.getClientChecks);
router.post('/update-payment-link-status/:token', payment_validate_1.default.updatePaymentLinkStatus, payment_controller_1.default.updatePaymentLinkStatus);
router.post('/update-invoice-status/:token', payment_validate_1.default.updatePaymentInvoiceStatus, payment_controller_1.default.updatePaymentInvoiceStatus);
router.get('/get-invoice-status/:token', payment_controller_1.default.getInvoiceStatus);
router.get('/get-payment-link-status/:token', payment_controller_1.default.getPaymentLinkStatus);
router.post('/statusChanged', seemlesschex_controller_1.default.statusChanged);
exports.default = router;
//# sourceMappingURL=seemlesschex.route.js.map