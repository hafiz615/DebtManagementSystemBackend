import {IContact} from '../../../database/interfaces/contact.interface';
import {Contact} from '../../../database/models/contact.model';
import {BaseRepository} from '../base.repository';
import {IContactRepository} from './contact.repository.interface';

export class ContactRepository
  extends BaseRepository<IContact>
  implements IContactRepository
{
  constructor() {
    super(Contact);
  }
}
