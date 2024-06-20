"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const enum_controller_1 = __importDefault(require("../controllers/enum/enum.controller"));
const router = (0, express_1.Router)();
router.post('/createEnum', authorize_middleware_1.default.validateAuth, enum_controller_1.default.createEnum);
router.get('/getAllEnums', authorize_middleware_1.default.validateAuth, enum_controller_1.default.getAllEnums);
router.get('/getEnumByTarget', authorize_middleware_1.default.validateAuth, enum_controller_1.default.getEnumByTarget);
exports.default = router;
//# sourceMappingURL=enum.routes.js.map