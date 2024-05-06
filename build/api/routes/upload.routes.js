"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = __importDefault(require("../controllers/upload/upload.controller"));
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.post('/files', authorize_middleware_1.default.validateAuth, upload.array('files'), upload_controller_1.default.uploadFiles);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map