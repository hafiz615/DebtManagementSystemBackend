import {IDomainVerify} from '../../../database/interfaces/domainVerify.interface';
import {DomainVerifyLink} from '../../../database/models/domainVerify.model';
import {BaseRepository} from '../base.repository';
import {IDomainVerifyRepository} from './domainVerify.repository.interface';

export class DomainVerifyRepository
  extends BaseRepository<IDomainVerify>
  implements IDomainVerifyRepository
{
  constructor() {
    super(DomainVerifyLink);
  }
}
