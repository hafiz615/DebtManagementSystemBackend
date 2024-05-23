import {ICustomField} from '../../../database/interfaces/customField.interface';
import {CustomFiled} from '../../../database/models/customField.model';
import {BaseRepository} from '../base.repository';
import {ICustomFieldsRepository} from './customField.repository.interface';

export class CustomFieldsRepository
  extends BaseRepository<ICustomField>
  implements ICustomFieldsRepository
{
  constructor() {
    super(CustomFiled);
  }
}
