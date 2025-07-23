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
const email_util_1 = __importDefault(require("../../utils/email.util"));
const notification_repomodel_1 = require("../../database/repomodels/notification.repomodel");
const app_1 = __importDefault(require("../../app"));
const notificationCount_repository_1 = require("../repository/notificationCount/notificationCount.repository");
const notification_repository_1 = require("../repository/notification/notification.repository");
class TasksService {
    constructor() {
        this.tasksRepository = new tasks_repository_1.TasksRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
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
            history['Notes'] = vaildatedTask.notes;
        await case_util_1.default.addInHistory(history, caseId);
        const notification = new notification_repomodel_1.Notification();
        notification.caseId = caseId;
        notification.debtorId = String(findCase.debtor);
        notification.type = 'TASK';
        notification.userId = task.assigneeId;
        notification.text = `Hey ${task.assignee}, You have a new task!`;
        await this.notificationRepository.create(notification);
        const count = await this.notificationCountRepository.upsert({ userId: task.assigneeId }, { $inc: { count: 1, taskCount: 1 } });
        console.log({
            notificationCount: count?.count || 0,
            type: 'TASK',
            taskCount: count.taskCount,
            notification: notification,
        });
        app_1.default.socketInstance.emit('notify', {
            notificationCount: count?.count || 0,
            type: 'TASK',
            taskCount: count.taskCount,
            notification: notification,
        });
        console.log('I have emit task noti');
        email_util_1.default.sendEmailOrSmsByEvent('case_task_added', caseId, null, reqTemp.id, String(task._id));
        return [true, task];
    }
    async updateTask(req) {
        const reqTemp = req;
        req.body.updatedAt = common_util_1.default.getCurrentDate();
        let task = await this.tasksRepository.getById(req.params.id);
        if (!task)
            return [false, constants_util_1.default.notFoundMessage('task')];
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
            history['Notes'] = req.body.notes;
        await case_util_1.default.addInHistory(history, updatedTask.caseId);
        if (task.assigneeId !== updatedTask.assigneeId) {
            const count = await this.notificationCountRepository.upsert({ userId: updatedTask.assigneeId }, { $inc: { count: 1, taskCount: 1 } });
            const notification = new notification_repomodel_1.Notification();
            notification.caseId = updatedTask.caseId;
            notification.type = 'TASK';
            notification.userId = updatedTask.assigneeId;
            notification.text = `Hey ${updatedTask.assignee}, You have a new task!`;
            await this.notificationRepository.create(notification);
            app_1.default.socketInstance.emit('notify', {
                notificationCount: count?.count || 0,
                type: 'TASK',
                taskCount: count.taskCount,
                notification: notification,
            });
            email_util_1.default.sendEmailOrSmsByEvent('case_task_added', task.caseId, null, reqTemp.id, String(task._id));
        }
        return [true, updatedTask];
    }
    async deleteTask(req) {
        const reqTemp = req;
        const task = await this.tasksRepository.updateByOne({ _id: req.params.id }, {
            isDeleted: true,
            updatedAt: common_util_1.default.getCurrentDate(),
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
    async getAllTasks() {
        try {
            const tasks = await this.tasksRepository.findAll({
                isDeleted: false,
                isCompleted: { $ne: true },
            });
            if (!tasks || tasks.length === 0) {
                return [false, constants_util_1.default.failureFetchMessage('tasks')];
            }
            const tasksMap = new Map();
            for (const task of tasks) {
                const assignee = task.assignee || 'Unassigned';
                if (!tasksMap.has(assignee)) {
                    tasksMap.set(assignee, []);
                }
                tasksMap.get(assignee)?.push(task);
            }
            const tasksByAssignee = Object.fromEntries(tasksMap);
            return [true, tasksByAssignee];
        }
        catch (error) {
            console.error(error);
            return [false, constants_util_1.default.failureFetchMessage('tasks')];
        }
    }
}
exports.default = TasksService;
//# sourceMappingURL=tasks.service.js.map