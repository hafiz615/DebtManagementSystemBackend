"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const status_controller_1 = __importDefault(require("../controllers/status/status.controller"));
const status_validate_1 = __importDefault(require("../../middleware/validators/status.validate"));
const router = (0, express_1.Router)();
router.get('/getCaseStatuses', authorize_middleware_1.default.validateAuth, status_controller_1.default.getCaseStatuses);
router.post('/addStatus', authorize_middleware_1.default.validateAuth, status_validate_1.default.addStatus, status_controller_1.default.addStatus);
router.get('/getStatusesById/:id', authorize_middleware_1.default.validateAuth, status_controller_1.default.getStatusesById);
router.post('/updateStatus/:id', authorize_middleware_1.default.validateAuth, status_validate_1.default.updateStatus, status_controller_1.default.updateStatus);
router.post('/updateStatusArray/:id', authorize_middleware_1.default.validateAuth, status_validate_1.default.updateStatusArray, status_controller_1.default.updateStatusArray);
router.post('/deleteStatus/:id', authorize_middleware_1.default.validateAuth, status_validate_1.default.deleteStatus, status_controller_1.default.deleteStatus);
exports.default = router;
//# sourceMappingURL=status.routes.js.map