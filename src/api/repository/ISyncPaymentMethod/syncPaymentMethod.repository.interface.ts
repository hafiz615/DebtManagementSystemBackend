import {ISyncPaymentMethod} from '../../../database/interfaces/syncPaymentMethod.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface ISyncPaymentMethodRepository
  extends IBaseRepository<ISyncPaymentMethod> {}
