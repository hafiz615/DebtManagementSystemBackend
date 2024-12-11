"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const tasks_controller_1 = __importDefault(require("../controllers/tasks/tasks.controller"));
const task_validate_1 = __importDefault(require("../../middleware/validators/task.validate"));
const router = (0, express_1.Router)();
router.get('/getTasks', authorize_middleware_1.default.validateAuth, tasks_controller_1.default.getTasks);
router.get('/getAllTasks', tasks_controller_1.default.getAllTasks);
router.post('/addTask', authorize_middleware_1.default.validateAuth, task_validate_1.default.addTask, tasks_controller_1.default.addTask);
router.get('/getTaskById/:id', authorize_middleware_1.default.validateAuth, tasks_controller_1.default.getTaskById);
router.put('/updateTask/:id', authorize_middleware_1.default.validateAuth, task_validate_1.default.updateTask, tasks_controller_1.default.updateTask);
router.delete('/deleteTask/:id', authorize_middleware_1.default.validateAuth, tasks_controller_1.default.deleteTask);
exports.default = router;
//# sourceMappingURL=tasks.routes.js.map