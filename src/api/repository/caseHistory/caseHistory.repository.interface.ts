import {ICaseHistory} from '../../../database/interfaces/caseHistory.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface IChatSummaryRepository extends IBaseRepository<ICaseHistory> {}
