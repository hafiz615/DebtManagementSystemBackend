import {IServiceFee} from '../../../database/interfaces/serviceFee.interface';
import {ServiceFee} from '../../../database/models/serviceFee.model';
import {BaseRepository} from '../base.repository';
import {IServiceFeeRepository} from './serviceFee.repository.interface';

export class ServiceFeeRepository
  extends BaseRepository<IServiceFee>
  implements IServiceFeeRepository
{
  constructor() {
    super(ServiceFee);
  }
}
