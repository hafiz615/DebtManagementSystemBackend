"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const pipelineStatus_controller_1 = __importDefault(require("../controllers/pipelineStatus/pipelineStatus.controller"));
const pipelineStatus_validate_1 = __importDefault(require("../../middleware/validators/pipelineStatus.validate"));
const router = (0, express_1.Router)();
router.post('/createPipeline', authorize_middleware_1.default.validateAuth, pipelineStatus_validate_1.default.addPipeline, pipelineStatus_controller_1.default.createPipeline);
router.get('/getAllPipelines', authorize_middleware_1.default.validateAuth, pipelineStatus_controller_1.default.getAllPipelines);
router.post('/addStatusPipeline/:id', authorize_middleware_1.default.validateAuth, pipelineStatus_validate_1.default.addStatusPipeline, pipelineStatus_controller_1.default.addStatusPipeline);
router.get('/getPipelineById/:id', authorize_middleware_1.default.validateAuth, pipelineStatus_controller_1.default.getPipelineById);
router.post('/updatePipeline/:id', authorize_middleware_1.default.validateAuth, pipelineStatus_validate_1.default.addPipeline, pipelineStatus_controller_1.default.updatePipeline);
router.delete('/deletePipeline/:id', authorize_middleware_1.default.validateAuth, pipelineStatus_controller_1.default.deletePipeline);
router.post('/updateStatusPipeline/:id', authorize_middleware_1.default.validateAuth, pipelineStatus_validate_1.default.updateStatusPipeline, pipelineStatus_controller_1.default.updateStatusPipeline);
router.post('/deleteStatusPipeline/:id', authorize_middleware_1.default.validateAuth, pipelineStatus_validate_1.default.deleteStatusPipeline, pipelineStatus_controller_1.default.deleteStatusPipeline);
router.get('/getPipelineDetails/:id', authorize_middleware_1.default.validateAuth, pipelineStatus_controller_1.default.getPipelineDetails);
exports.default = router;
//# sourceMappingURL=pipelineStatus.routes.js.map