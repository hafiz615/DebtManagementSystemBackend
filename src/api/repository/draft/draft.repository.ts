import {IDraft} from '../../../database/interfaces/draft.interface';
import {Draft} from '../../../database/models/draft.model';
import {BaseRepository} from '../base.repository';
import { IDraftRepository } from './draft.repository.interface';

export class DraftRepository
  extends BaseRepository<IDraft>
  implements IDraftRepository
{
  constructor() {
    super(Draft);
  }
}