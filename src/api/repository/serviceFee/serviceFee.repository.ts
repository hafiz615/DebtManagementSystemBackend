import {IFee} from '../../../database/interfaces/serviceFee.interface';
import {Fee} from '../../../database/models/fee.model';
import {BaseRepository} from '../base.repository';
import {IServiceFeeRepository} from './serviceFee.repository.interface';

export class ServiceFeeRepository
  extends BaseRepository<IFee>
  implements IServiceFeeRepository
{
  constructor() {
    super(Fee);
  }
}
