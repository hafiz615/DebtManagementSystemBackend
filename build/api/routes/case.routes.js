"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const case_controller_1 = __importDefault(require("../controllers/case/case.controller"));
const case_validate_1 = __importDefault(require("../../middleware/validators/case.validate"));
const router = (0, express_1.Router)();
router.post('/createCase', authorize_middleware_1.default.validateAuth, case_validate_1.default.validateCase, case_controller_1.default.createCase);
router.get('/getAllCases', authorize_middleware_1.default.validateAuth, case_controller_1.default.getAllCases);
router.get('/getCaseById/:id', authorize_middleware_1.default.validateAuth, case_controller_1.default.getCaseById);
router.put('/updateCase/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.validateCase, case_controller_1.default.updateCase);
router.put('/updateCaseAbout/:id', authorize_middleware_1.default.validateAuth, case_validate_1.default.validateCaseAbout, case_controller_1.default.updateCaseAbout);
exports.default = router;
//# sourceMappingURL=case.routes.js.map