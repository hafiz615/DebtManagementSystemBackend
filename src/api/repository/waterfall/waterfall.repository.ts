import {IWaterfall} from '../../../database/interfaces/waterfall.interface';
import {Waterfall} from '../../../database/models/waterfall.model';
import {BaseRepository} from '../base.repository';
import {IWaterfallRepository} from './waterfall.repository.interface';

export class WaterfallRepository
  extends BaseRepository<IWaterfall>
  implements IWaterfallRepository
{
  constructor() {
    super(Waterfall);
  }
}
