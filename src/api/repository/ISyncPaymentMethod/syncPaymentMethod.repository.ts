import {ISyncPaymentMethod} from '../../../database/interfaces/syncPaymentMethod.interface';
import {SyncPaymentMethod} from '../../../database/models/syncPaymentMethod.model';
import {BaseRepository} from '../base.repository';
import {ISyncPaymentMethodRepository} from './syncPaymentMethod.repository.interface';

export class SyncPaymentMethodRepository
  extends BaseRepository<ISyncPaymentMethod>
  implements ISyncPaymentMethodRepository
{
  constructor() {
    super(SyncPaymentMethod);
  }
}
