"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const debtor_controller_1 = __importDefault(require("../controllers/debtor/debtor.controller"));
const router = (0, express_1.Router)();
router.get('/getDebtor', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtor);
router.get('/listing', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.listing);
exports.default = router;
//# sourceMappingURL=debtor.routes.js.map