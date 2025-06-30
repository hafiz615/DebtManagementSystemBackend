import {IAttorney} from '../database/interfaces/attorney.interface';
import {Attorney} from '../database/repomodels/attorney.repomodel';
import {DataCopier} from './dataCopier.util';
import {WaterfallRepository} from '../api/repository/waterfall/waterfall.repository';
import {IWaterfall} from '../database/interfaces/waterfall.interface';
import commonUtil from './common.util';
class WaterfallUtil {
  private waterfallRepository: WaterfallRepository;

  constructor() {
    this.waterfallRepository = new WaterfallRepository();
  }

  async upsertWaterfall(debtorId: string, paymentId: string, execute: boolean) {
    return await this.waterfallRepository.upsert<IWaterfall>(
      {debtorId, paymentId},
      {
        execute: execute,
        $setOnInsert: {createdAt: commonUtil.getCurrentDate()},
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
  }
}
export default new WaterfallUtil();
