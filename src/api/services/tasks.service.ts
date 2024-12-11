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

class TasksService {
  private tasksRepository: TasksRepository;
  private caseRepository: CaseRepository;
  constructor() {
    this.tasksRepository = new TasksRepository();
    this.caseRepository = new CaseRepository();
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
    return [true, task];
  }

  async updateTask(req: Request): Promise<[boolean, ITasks | string]> {
    const reqTemp: any = req;
    req.body.updatedAt = commonUtil.getCurrentDate();
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

  async getAllTasks(): Promise<[boolean, ITasks[] | string]> {
    try {
      const tasks = await this.tasksRepository.findAll<ITasks>({ isDeleted: false });
  
      if (!tasks || tasks.length === 0) {
        return [false, constantsUtil.failureFetchMessage('tasks')];
      }

      return [true, tasks];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [false, constantsUtil.unexpectedErrorMessage('fetching tasks')];
    }
  }
  
}

export default TasksService;
