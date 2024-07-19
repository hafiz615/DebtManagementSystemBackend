"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const debtor_controller_1 = __importDefault(require("../controllers/debtor/debtor.controller"));
const debtor_validate_1 = __importDefault(require("../../middleware/validators/debtor.validate"));
const router = (0, express_1.Router)();
router.post('/getDebtor', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtor);
router.post('/listing/details/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.listingDetails);
router.post('/listing/search', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.searchListing);
router.put('/updateDebtor/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.validateDebtor, debtor_controller_1.default.updateDebtor);
router.post('/createVault/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.createVault);
router.get('/retryAuth/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.retryAuth);
router.get('/retryCapture/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.retryCapture);
router.get('/getAllDebtors', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getAllDebtors);
exports.default = router;
//# sourceMappingURL=debtor.routes.js.map