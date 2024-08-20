import {ICustomField} from '../../../database/interfaces/customField.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface ICustomFieldsRepository
  extends IBaseRepository<ICustomField> {}
