import {IPipelineStatus} from '../../../database/interfaces/pipelineStatus.interface';
import {PipelineStatus} from '../../../database/models/pipelineStatus.model';
import {BaseRepository} from '../base.repository';
import {IPipelineStatusRepository} from './pipelineStatus.repository.interface';

export class PipelineStatusRepository
  extends BaseRepository<IPipelineStatus>
  implements IPipelineStatusRepository
{
  constructor() {
    super(PipelineStatus);
  }
}
