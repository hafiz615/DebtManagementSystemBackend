import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {DataCopier} from '../../utils/dataCopier.util';
import {TasksRepository} from '../repository/tasks/tasks.repository';
import {ITasks} from '../../database/interfaces/tasks.interface';
import {Tasks} from '../../database/repomodels/tasks.repomodel';

class TasksService {
  private tasksRepository: TasksRepository;
  constructor() {
    this.tasksRepository = new TasksRepository();
  }
  async getTasks(req: Request): Promise<[boolean, ITasks[] | string]> {
    if (!req.query.caseId) return [false, 'Case id is missing'];
    const tasks = await this.tasksRepository.getAllWithoutPagination<ITasks>({
      caseId: String(req.query.caseId),
      isDeleted: false,
    });
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
    const caseId = String(req.query.caseId);
    if (!caseId) {
      return [false, 'Case id is missing'];
    }

    const newtask = new Tasks();
    newtask.caseId = caseId;
    const vaildatedTask = DataCopier.copy(newtask, req.body);
    const task = await this.tasksRepository.create<ITasks>(vaildatedTask);
    if (!task) {
      return [false, constantsUtil.failureAddMessage('task')];
    }
    return [true, task];
  }

  async updateTask(req: Request): Promise<[boolean, ITasks | string]> {
    const updatedTask = await this.tasksRepository.updateById<ITasks>(
      req.params.id,
      req.body
    );

    if (!updatedTask) {
      return [false, constantsUtil.failureUpdateMessage('task')];
    }

    return [true, updatedTask];
  }

  async deleteTask(req: Request): Promise<[boolean, ITasks | string]> {
    const task = await this.tasksRepository.updateByOne<ITasks>(
      {_id: req.params.id},
      {
        isDeleted: true,
      }
    );
    if (!task) {
      return [false, constantsUtil.failureDeleteMessage('task')];
    }
    return [true, task];
  }
}

export default TasksService;
