"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const settings_controller_1 = __importDefault(require("../controllers/setting/settings.controller"));
const router = (0, express_1.Router)();
router.post('/addSettings', authorize_middleware_1.default.validateAuth, settings_controller_1.default.addSettings);
router.post('/addCustomFields', authorize_middleware_1.default.validateAuth, settings_controller_1.default.addCustomFields);
router.post('/editCustomFields', authorize_middleware_1.default.validateAuth, settings_controller_1.default.editCustomFields);
router.post('/getCustomFields', authorize_middleware_1.default.validateAuth, settings_controller_1.default.getCustomFields);
router.post('/deleteCustomField', authorize_middleware_1.default.validateAuth, settings_controller_1.default.deleteCustomField);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map