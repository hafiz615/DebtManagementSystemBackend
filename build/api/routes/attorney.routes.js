"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const attorney_validate_1 = __importDefault(require("../../middleware/validators/attorney.validate"));
const attorney_controller_1 = __importDefault(require("../controllers/attorney/attorney.controller"));
const router = (0, express_1.Router)();
router.get('/getLawsuitDetails/:id', authorize_middleware_1.default.validateAuth, attorney_controller_1.default.getLawsuitDetails);
router.post('/cancelLawSuitPaymentPlan/:id', authorize_middleware_1.default.validateAuth, attorney_validate_1.default.validateCaseId, attorney_controller_1.default.cancelLawSuitPaymentPlan);
router.put('/updateAttorney/:id', authorize_middleware_1.default.validateAuth, attorney_controller_1.default.updateAttorney);
exports.default = router;
//# sourceMappingURL=attorney.routes.js.map