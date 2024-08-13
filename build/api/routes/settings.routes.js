"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const settings_controller_1 = __importDefault(require("../controllers/setting/settings.controller"));
const customField_validate_1 = __importDefault(require("../../middleware/validators/customField.validate"));
const setting_validation_1 = __importDefault(require("../../middleware/validators/setting.validation"));
const router = (0, express_1.Router)();
router.post('/addSettings', authorize_middleware_1.default.validateAuth, settings_controller_1.default.addSettings);
router.get('/getSettings', authorize_middleware_1.default.validateAuth, settings_controller_1.default.getSettings);
router.post('/addCustomField', authorize_middleware_1.default.validateAuth, customField_validate_1.default.addCustomField, settings_controller_1.default.addCustomField);
router.put('/editCustomField/:id', authorize_middleware_1.default.validateAuth, settings_controller_1.default.editCustomField);
router.get('/getCustomFieldsByTarget', authorize_middleware_1.default.validateAuth, settings_controller_1.default.getCustomFieldsByTarget);
router.post('/addCustomFieldByTarget', authorize_middleware_1.default.validateAuth, settings_controller_1.default.addCustomFieldByTarget);
router.put('/updateCustomFieldByTarget', authorize_middleware_1.default.validateAuth, settings_controller_1.default.updateCustomFieldByTarget);
router.delete('/removeCustomFieldByTarget', authorize_middleware_1.default.validateAuth, settings_controller_1.default.removeCustomFieldByTarget);
router.delete('/deleteCustomField/:id', authorize_middleware_1.default.validateAuth, settings_controller_1.default.deleteCustomField);
router.put('/editNotificationTemplate', authorize_middleware_1.default.validateAuth, settings_controller_1.default.editNotificationTemplate);
router.post('/deleteNotificationTemplate', authorize_middleware_1.default.validateAuth, settings_controller_1.default.deleteNotificationTemplate);
router.post('/addNotificationConfiguration', authorize_middleware_1.default.validateAuth, setting_validation_1.default.validateNotificationConfiguration, settings_controller_1.default.notificationConfiguration);
router.get('/getNotificationConfiguration', authorize_middleware_1.default.validateAuth, settings_controller_1.default.getNotificationConfiguration);
router.get('/getSystemTemplate', authorize_middleware_1.default.validateAuth, settings_controller_1.default.getSystemTemplate);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map