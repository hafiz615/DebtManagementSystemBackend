import {IInbox} from '../../../database/interfaces/inbox.interface';
import {Inbox} from '../../../database/models/inbox.model';
import {BaseRepository} from '../base.repository';
import {IInboxRepository} from './inbox.repository.interface';

export class InboxRepository
  extends BaseRepository<IInbox>
  implements IInboxRepository
{
  constructor() {
    super(Inbox);
  }
}
