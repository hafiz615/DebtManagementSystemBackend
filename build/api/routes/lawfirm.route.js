"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const lawfirm_controller_1 = __importDefault(require("../controllers/lawfirm/lawfirm.controller"));
const lawfirm_validate_1 = __importDefault(require("../../middleware/validators/lawfirm.validate"));
const router = (0, express_1.Router)();
router.post('/create/lawfirm/:id', authorize_middleware_1.default.validateAuth, lawfirm_controller_1.default.createLawfirm);
router.put('/updateLawfirm/:id', authorize_middleware_1.default.validateAuth, lawfirm_validate_1.default.updateLawfirm, lawfirm_controller_1.default.updateLawfirm);
router.get('/getLawfirms', authorize_middleware_1.default.validateAuth, lawfirm_controller_1.default.getLawfirm);
router.post('/assignLawfirmToCase/:id', authorize_middleware_1.default.validateAuth, lawfirm_validate_1.default.assignLawfirmToCase, lawfirm_controller_1.default.assignLawfirmToCase);
router.post('/updateLawsuit/:id', authorize_middleware_1.default.validateAuth, lawfirm_validate_1.default.updateLawsuit, lawfirm_controller_1.default.updateLawsuit);
router.post('/addAttorney/:id', authorize_middleware_1.default.validateAuth, lawfirm_validate_1.default.addAttorney, lawfirm_controller_1.default.addAttorney);
exports.default = router;
//# sourceMappingURL=lawfirm.route.js.map