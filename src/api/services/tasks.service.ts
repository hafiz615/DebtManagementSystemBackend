import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {DataCopier} from '../../utils/dataCopier.util';
import {TasksRepository} from '../repository/tasks/tasks.repository';
import {ITasks} from '../../database/interfaces/tasks.interface';
import {Tasks} from '../../database/repomodels/tasks.repomodel';
import caseUtil from '../../utils/case.util';
import {ICase} from '../../database/interfaces/case.interface';
import {CaseRepository} from '../repository/case/case.repository';
import commonUtil from '../../utils/common.util';
import emailUtil from '../../utils/email.util';
import {Notification} from '../../database/repomodels/notification.repomodel';
import app from '../../app';
import {INotificationCount} from '../../database/interfaces/notificationCount.interface';
import {NotificationCountRepository} from '../repository/notificationCount/notificationCount.repository';
import {INotification} from '../../database/interfaces/notification.interface';
import {NotificationRepository} from '../repository/notification/notification.repository';

class TasksService {
  private tasksRepository: TasksRepository;
  private caseRepository: CaseRepository;
  private notificationCountRepository: NotificationCountRepository;
  private notificationRepository: NotificationRepository;
  constructor() {
    this.tasksRepository = new TasksRepository();
    this.caseRepository = new CaseRepository();
    this.notificationCountRepository = new NotificationCountRepository();
    this.notificationRepository = new NotificationRepository();
  }
  async getTasks(req: Request): Promise<[boolean, ITasks[] | string]> {
    if (!req.query.caseId) return [false, 'Case id is missing'];
    const tasks = await this.tasksRepository.getAllWithoutPagination<ITasks>(
      {
        caseId: String(req.query.caseId),
        isDeleted: false,
      },
      undefined,
      undefined,
      {_id: -1}
    );
    if (!tasks.length) {
      return [false, constantsUtil.notFoundMessage('Tasks')];
    }
    return [true, tasks];
  }

  async getTaskById(req: Request): Promise<[boolean, ITasks | string]> {
    const task = await this.tasksRepository.getById<ITasks>(req.params.id);
    if (!task) {
      return [false, constantsUtil.notFoundMessage('Task')];
    }
    return [true, task];
  }
  async addTask(req: Request): Promise<[boolean, ITasks | string]> {
    const reqTemp: any = req;
    const caseId = String(req.query.caseId);
    if (!caseId) {
      return [false, 'Case id is missing'];
    }
    let findCase = await this.caseRepository.getById<ICase>(caseId);
    if (!findCase) return [false, constantsUtil.notFoundMessage('case')];
    const newtask = new Tasks();
    newtask.caseId = caseId;
    const vaildatedTask = DataCopier.copy(newtask, req.body);
    const task = await this.tasksRepository.create<ITasks>(vaildatedTask);
    if (!task) {
      return [false, constantsUtil.failureAddMessage('task')];
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
    if (vaildatedTask.notes) history['Notes'] = vaildatedTask.notes;
    await caseUtil.addInHistory(history, caseId);
    const notification = new Notification();
    notification.caseId = caseId;
    notification.debtorId = String(findCase.debtor);
    notification.type = 'TASK';
    notification.userId = task.assigneeId;
    notification.text = `Hey ${task.assignee}, You have a new task!`;
    await this.notificationRepository.create<INotification>(
      notification as any
    );
    const count =
      await this.notificationCountRepository.upsert<INotificationCount>(
        {userId: task.assigneeId},
        {$inc: {count: 1, taskCount: 1, taskNotificationCount: 1}}
      );
    console.log({
      notificationCount: count?.count || 0,
      type: 'TASK',
      taskCount: count.taskCount,
      notification: notification,
    });
    app.socketInstance.emit('notify', {
      notificationCount: count?.count || 0,
      type: 'TASK',
      taskNotificationCount: count.taskNotificationCount,
      notification: notification,
    });

    console.log('I have emit task noti');
    emailUtil.sendEmailOrSmsByEvent(
      'case_task_added',
      caseId,
      null,
      reqTemp.id,
      String(task._id)
    );

    return [true, task];
  }

  async updateTask(req: Request): Promise<[boolean, ITasks | string]> {
    const reqTemp: any = req;
    req.body.updatedAt = commonUtil.getCurrentDate();
    let task = await this.tasksRepository.getById<ITasks>(req.params.id);
    if (!task) return [false, constantsUtil.notFoundMessage('task')];
    const updatedTask = await this.tasksRepository.updateById<ITasks>(
      req.params.id,
      req.body
    );

    if (!updatedTask) {
      return [false, constantsUtil.failureUpdateMessage('task')];
    }
    const history = {
      Action: 'Task Updated',
      Status: req.body.status,
      'Due Date': req.body.dueDate,
      Time: new Date(commonUtil.getCurrentDate()),
      Assignee: req.body.assignee,
      Assigner: reqTemp.name,
    };
    if (req.body.notes) history['Notes'] = req.body.notes;
    await caseUtil.addInHistory(history, updatedTask.caseId);
    if (task.assigneeId !== updatedTask.assigneeId) {
      const count =
        await this.notificationCountRepository.upsert<INotificationCount>(
          {userId: updatedTask.assigneeId},
          {$inc: {count: 1, taskCount: 1, taskNotificationCount: 1}}
        );
      const notification = new Notification();
      notification.caseId = updatedTask.caseId;
      notification.type = 'TASK';
      notification.userId = updatedTask.assigneeId;
      notification.text = `Hey ${updatedTask.assignee}, You have a new task!`;
      await this.notificationRepository.create<INotification>(
        notification as any
      );
      app.socketInstance.emit('notify', {
        notificationCount: count?.count || 0,
        type: 'TASK',
        taskNotificationCount: count.taskNotificationCount,
        notification: notification,
      });
      emailUtil.sendEmailOrSmsByEvent(
        'case_task_added',
        task.caseId,
        null,
        reqTemp.id,
        String(task._id)
      );
    }
    return [true, updatedTask];
  }

  async deleteTask(req: Request): Promise<[boolean, ITasks | string]> {
    const reqTemp: any = req;
    const task = await this.tasksRepository.updateByOne<ITasks>(
      {_id: req.params.id},
      {
        isDeleted: true,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    if (!task) {
      return [false, constantsUtil.failureDeleteMessage('task')];
    }
    const history = {
      Action: 'Task Deleted',
      Title: task.title,
      Time: new Date(commonUtil.getCurrentDate()),
      'Delete By': reqTemp.name,
    };
    await caseUtil.addInHistory(history, task.caseId);
    return [true, task];
  }

  async getAllTasks(): Promise<[boolean, Record<string, ITasks[]> | string]> {
    try {
      const tasks = await this.tasksRepository.findAll<ITasks>({
        isDeleted: false,
        isCompleted: {$ne: true},
      });

      if (!tasks || tasks.length === 0) {
        return [false, constantsUtil.failureFetchMessage('tasks')];
      }

      const tasksMap = new Map<string, ITasks[]>();

      for (const task of tasks) {
        const assignee = task.assignee || 'Unassigned';
        if (!tasksMap.has(assignee)) {
          tasksMap.set(assignee, []);
        }
        tasksMap.get(assignee)?.push(task);
      }

      const tasksByAssignee = Object.fromEntries(tasksMap);

      return [true, tasksByAssignee];
    } catch (error) {
      console.error(error);
      return [false, constantsUtil.failureFetchMessage('tasks')];
    }
  }
}

export default TasksService;
