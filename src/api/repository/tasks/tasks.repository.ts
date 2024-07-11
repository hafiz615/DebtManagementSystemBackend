import {ITasks} from '../../../database/interfaces/tasks.interface';
import {Tasks} from '../../../database/models/tasks.model';
import {BaseRepository} from '../base.repository';
import {ITasksRepository} from './tasks.repository.interface';

export class TasksRepository
  extends BaseRepository<ITasks>
  implements ITasksRepository
{
  constructor() {
    super(Tasks);
  }
}
