"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_validate_1 = __importDefault(require("../../validators/user.validate"));
const user_controller_1 = __importDefault(require("../controllers/user/user.controller"));
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const router = (0, express_1.Router)();
router.post('/createUser', authorize_middleware_1.default.validateAuth, authorize_middleware_1.default.validateRole, user_validate_1.default.createUser, user_controller_1.default.createUser);
router.post('/signIn', user_validate_1.default.signIn, user_controller_1.default.signIn);
router.get('/getUserById/:id', authorize_middleware_1.default.validateAuth, authorize_middleware_1.default.validateRole, user_controller_1.default.getUserById);
router.get('/getUser', user_controller_1.default.getUser);
router.put('/updateUser', authorize_middleware_1.default.validateAuth, authorize_middleware_1.default.validateRole, user_controller_1.default.updateUser);
router.put('/updatePassword', user_controller_1.default.updatePassword);
router.put('/resetPassword', authorize_middleware_1.default.validateAuth, user_controller_1.default.resetPassword);
router.delete('/deleteUserById/:id', authorize_middleware_1.default.validateAuth, authorize_middleware_1.default.validateRole, user_controller_1.default.deleteUserById);
router.post('/verifyInvitationLink', user_controller_1.default.verifyInvitationLink);
router.post('/resendInvitationLink', user_controller_1.default.resendInvitationLink);
router.get('/getAllUsers', authorize_middleware_1.default.validateAuth, user_controller_1.default.getAllUsers);
exports.default = router;
//# sourceMappingURL=user.routes.js.map