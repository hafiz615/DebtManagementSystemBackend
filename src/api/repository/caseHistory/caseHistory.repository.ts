import {ICaseHistory} from '../../../database/interfaces/caseHistory.interface';
import {CaseHistory} from '../../../database/models/caseHistory.model';
import {BaseRepository} from '../base.repository';
import {IChatSummaryRepository} from './caseHistory.repository.interface';
export class CaseHistoryRepository
  extends BaseRepository<ICaseHistory>
  implements IChatSummaryRepository
{
  constructor() {
    super(CaseHistory);
  }
}
