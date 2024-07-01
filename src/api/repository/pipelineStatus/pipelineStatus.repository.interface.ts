import {IPipelineStatus} from '../../../database/interfaces/pipelineStatus.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface IPipelineStatusRepository
  extends IBaseRepository<IPipelineStatus> {}
