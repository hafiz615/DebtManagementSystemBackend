"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const tasks_repository_1 = require("../repository/tasks/tasks.repository");
const tasks_repomodel_1 = require("../../database/repomodels/tasks.repomodel");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const case_repository_1 = require("../repository/case/case.repository");
const common_util_1 = __importDefault(require("../../utils/common.util"));
class TasksService {
    constructor() {
        this.tasksRepository = new tasks_repository_1.TasksRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getTasks(req) {
        if (!req.query.caseId)
            return [false, 'Case id is missing'];
        const tasks = await this.tasksRepository.getAllWithoutPagination({
            caseId: String(req.query.caseId),
            isDeleted: false,
        }, undefined, undefined, { _id: -1 });
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
        const reqTemp = req;
        const caseId = String(req.query.caseId);
        if (!caseId) {
            return [false, 'Case id is missing'];
        }
        let findCase = await this.caseRepository.getById(caseId);
        if (!findCase)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const newtask = new tasks_repomodel_1.Tasks();
        newtask.caseId = caseId;
        const vaildatedTask = dataCopier_util_1.DataCopier.copy(newtask, req.body);
        const task = await this.tasksRepository.create(vaildatedTask);
        if (!task) {
            return [false, constants_util_1.default.failureAddMessage('task')];
        }
        const history = {
            Action: 'Task Created',
            Status: 'To do',
            Title: vaildatedTask.title,
            'Due Date': vaildatedTask.dueDate,
            Time: new Date(vaildatedTask.createdAt),
            Assignee: vaildatedTask.assignee,
            Assigner: reqTemp.name,
        };
        if (vaildatedTask.notes)
            history['notes'] = vaildatedTask.notes;
        await case_util_1.default.addInHistory(history, caseId);
        return [true, task];
    }
    async updateTask(req) {
        const reqTemp = req;
        const updatedTask = await this.tasksRepository.updateById(req.params.id, req.body);
        if (!updatedTask) {
            return [false, constants_util_1.default.failureUpdateMessage('task')];
        }
        const history = {
            Action: 'Task Updated',
            Status: req.body.status,
            'Due Date': req.body.dueDate,
            Time: new Date(common_util_1.default.getCurrentDate()),
            Assignee: req.body.assignee,
            Assigner: reqTemp.name,
        };
        if (req.body.notes)
            history['notes'] = req.body.notes;
        await case_util_1.default.addInHistory(history, updatedTask.caseId);
        return [true, updatedTask];
    }
    async deleteTask(req) {
        const reqTemp = req;
        const task = await this.tasksRepository.updateByOne({ _id: req.params.id }, {
            isDeleted: true,
        });
        if (!task) {
            return [false, constants_util_1.default.failureDeleteMessage('task')];
        }
        const history = {
            Action: 'Task Deleted',
            Title: task.title,
            Time: new Date(common_util_1.default.getCurrentDate()),
            'Delete By': reqTemp.name,
        };
        await case_util_1.default.addInHistory(history, task.caseId);
        return [true, task];
    }
}
exports.default = TasksService;
//# sourceMappingURL=tasks.service.js.map