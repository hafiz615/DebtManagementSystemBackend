"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const payment_controller_1 = __importDefault(require("../controllers/payment/payment.controller"));
const payment_validate_1 = __importDefault(require("../../middleware/validators/payment.validate"));
const router = (0, express_1.Router)();
router.post('/getHomePayments', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getHomePayments);
router.post('/getCreditorSuccessfulPayments', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getCreditorSuccessfulPayments);
router.post('/creditorUpcomingPayments', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getCreditorUpcomingPayments);
router.get('/getCasePayments/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getCasePayments);
router.get('/getAllUpcomingPayments/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getAllUpcomingPayments);
router.post('/addACHDetails/:id', authorize_middleware_1.default.validateAuth, payment_validate_1.default.addACHDetails, payment_controller_1.default.addACHDetails);
router.put('/updateACHDetails/:id', authorize_middleware_1.default.validateAuth, payment_validate_1.default.updateACHDetails, payment_controller_1.default.updateACHDetails);
router.get('/processAuthAndCapture', authorize_middleware_1.default.validateAuth, payment_controller_1.default.processAuthAndCapture);
router.get('/processPaynoteTransfer', authorize_middleware_1.default.validateAuth, payment_controller_1.default.processPaynoteTransfer);
router.get('/firstChoiceCommission', authorize_middleware_1.default.validateAuth, payment_controller_1.default.firstChoiceCommission);
router.get('/sendPaymentPaynote/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.sendPaymentPaynote);
router.get('/cancelCasePaymentPlan/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.cancelCasePaymentPlan);
router.get('/cancelDebtorPaymentPlan/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.cancelDebtorPaymentPlan);
router.get('/getCommissionPayments', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getCommissionPayments);
router.get('/getRelatedPayments/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.getRelatedPayments);
router.post('/addAttorneyPaymentPlan/:id', authorize_middleware_1.default.validateAuth, payment_controller_1.default.addPaymentPlan);
router.post('/updatePaymentDate/:id', authorize_middleware_1.default.validateAuth, payment_validate_1.default.updatePaymentDate, payment_controller_1.default.updatePaymentDate);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map