import {IPayment} from '../../../database/interfaces/payment.interface';
import {IUser} from '../../../database/interfaces/user.interface';
import {Payment} from '../../../database/models/payment.model';
import {User} from '../../../database/models/user.model';
import {BaseRepository} from '../base.repository';
import {IPaymentRepository} from './payment.repository.interface';

export class PaymentRepository
  extends BaseRepository<IPayment>
  implements IPaymentRepository
{
  constructor() {
    super(Payment);
  }
}
