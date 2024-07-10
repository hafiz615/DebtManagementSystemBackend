"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const rolesPermissions_controller_1 = __importDefault(require("../controllers/rolesPermissions/rolesPermissions.controller"));
const rolesPermissions_validate_1 = __importDefault(require("../../middleware/validators/rolesPermissions.validate"));
const router = (0, express_1.Router)();
router.post('/createRole', authorize_middleware_1.default.validateAuth, rolesPermissions_validate_1.default.role, rolesPermissions_controller_1.default.createRole);
router.get('/getAllRoles', authorize_middleware_1.default.validateAuth, rolesPermissions_controller_1.default.getAllRoles);
router.get('/getRoleById/:id', authorize_middleware_1.default.validateAuth, rolesPermissions_controller_1.default.getRoleById);
router.post('/updateRole/:id', authorize_middleware_1.default.validateAuth, rolesPermissions_validate_1.default.role, rolesPermissions_controller_1.default.updateRole);
router.delete('/deleteRole/:id', authorize_middleware_1.default.validateAuth, rolesPermissions_controller_1.default.deleteRole);
exports.default = router;
//# sourceMappingURL=rolesPermissions.routes.js.map