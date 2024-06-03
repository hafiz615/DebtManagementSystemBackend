import {IPaymentLogging} from '../../../database/interfaces/paymentLogging.interface';
import {PaymentLogging} from '../../../database/models/paymentLogging.model';
import {BaseRepository} from '../base.repository';
import {IPaymentLoggingRepository} from './paymentLogging.repository.interface';

export class PaymentLoggingRepository
  extends BaseRepository<IPaymentLogging>
  implements IPaymentLoggingRepository
{
  constructor() {
    super(PaymentLogging);
  }
}
