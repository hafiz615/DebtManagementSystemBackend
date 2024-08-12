import {IStrategy} from '../../../database/interfaces/strategy.interface';
import {Strategy} from '../../../database/models/strategy.model';
import {BaseRepository} from '../base.repository';
import {IStrategyRepository} from './strategy.repository.interface';

export class StrategyRepository
  extends BaseRepository<IStrategy>
  implements IStrategyRepository
{
  constructor() {
    super(Strategy);
  }
}
