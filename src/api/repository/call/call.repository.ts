import {ICall} from '../../../database/interfaces/call.interface';
import {Call} from '../../../database/models/call.model';
import {BaseRepository} from '../base.repository';
import {ICallRepository} from './call.repository.interface';

export class CallRepository
  extends BaseRepository<ICall>
  implements ICallRepository
{
  constructor() {
    super(Call);
  }
}
