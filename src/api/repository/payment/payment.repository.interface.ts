import {IPayment} from '../../../database/interfaces/payment.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface IPaymentRepository extends IBaseRepository<IPayment> {}
