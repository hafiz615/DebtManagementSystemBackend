import {IChatSummary} from '../../../database/interfaces/chatSummary.interface';
import {ChatSummary} from '../../../database/models/chatSummary.model';
import {BaseRepository} from '../base.repository';
import {IChatSummaryRepository} from './chatSummary.repository.interface';
export class ChatSummaryRepository
  extends BaseRepository<IChatSummary>
  implements IChatSummaryRepository
{
  constructor() {
    super(ChatSummary);
  }
}
