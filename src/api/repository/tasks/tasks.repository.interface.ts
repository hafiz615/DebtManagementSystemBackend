import {ITasks} from '../../../database/interfaces/tasks.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface ITasksRepository extends IBaseRepository<ITasks> {}
