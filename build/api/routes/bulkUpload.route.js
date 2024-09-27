"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const bulkUpload_controller_1 = __importDefault(require("../controllers/bulkUpload/bulkUpload.controller"));
bulkUpload_controller_1.default;
const router = (0, express_1.Router)();
router.get('/bulkUploadAnalytics', authorize_middleware_1.default.validateAuth, bulkUpload_controller_1.default.getBulkUploadAnalytics);
router.get('/getBulkCasesDetails/:id', authorize_middleware_1.default.validateAuth, bulkUpload_controller_1.default.getBulkCasesDetails);
exports.default = router;
//# sourceMappingURL=bulkUpload.route.js.map