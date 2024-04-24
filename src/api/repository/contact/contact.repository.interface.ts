import {IContact} from '../../../database/interfaces/contact.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface IContactRepository extends IBaseRepository<IContact> {}
