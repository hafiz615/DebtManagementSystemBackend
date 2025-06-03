import {IEmailThreading} from '../../../database/interfaces/emailThreading.interface';
import {EmailThreading} from '../../../database/models/emailThreading.model';
import {BaseRepository} from '../base.repository';
import {IEmailThreadingRepository} from './emailThreading.repository.interface';

export class EmailThreadingRepository
  extends BaseRepository<IEmailThreading>
  implements IEmailThreadingRepository
{
  constructor() {
    super(EmailThreading);
  }
}
