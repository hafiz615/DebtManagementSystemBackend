"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const tasks_repository_1 = require("../repository/tasks/tasks.repository");
const tasks_repomodel_1 = require("../../database/repomodels/tasks.repomodel");
class TasksService {
    constructor() {
        this.tasksRepository = new tasks_repository_1.TasksRepository();
    }
    async getTasks(req) {
        if (!req.query.caseId)
            return [false, 'Case id is missing'];
        const tasks = await this.tasksRepository.getAllWithoutPagination({
            caseId: String(req.query.caseId),
            isDeleted: false,
        });
        if (!tasks.length) {
            return [false, constants_util_1.default.notFoundMessage('Tasks')];
        }
        return [true, tasks];
    }
    async getTaskById(req) {
        const task = await this.tasksRepository.getById(req.params.id);
        if (!task) {
            return [false, constants_util_1.default.notFoundMessage('Task')];
        }
        return [true, task];
    }
    async addTask(req) {
        const caseId = String(req.query.caseId);
        if (!caseId) {
            return [false, 'Case id is missing'];
        }
        const newtask = new tasks_repomodel_1.Tasks();
        newtask.caseId = caseId;
        const vaildatedTask = dataCopier_util_1.DataCopier.copy(newtask, req.body);
        const task = await this.tasksRepository.create(vaildatedTask);
        if (!task) {
            return [false, constants_util_1.default.failureAddMessage('task')];
        }
        return [true, task];
    }
    async updateTask(req) {
        const updatedTask = await this.tasksRepository.updateById(req.params.id, req.body);
        if (!updatedTask) {
            return [false, constants_util_1.default.failureUpdateMessage('task')];
        }
        return [true, updatedTask];
    }
    async deleteTask(req) {
        const task = await this.tasksRepository.updateByOne({ _id: req.params.id }, {
            isDeleted: true,
        });
        if (!task) {
            return [false, constants_util_1.default.failureDeleteMessage('task')];
        }
        return [true, task];
    }
}
exports.default = TasksService;
//# sourceMappingURL=tasks.service.js.map