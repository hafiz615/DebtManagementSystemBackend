import {BaseRepository} from '../base.repository';
import {IVoiceMail} from '../../../database/interfaces/voiceMail.interface';
import {IVoiceMailRepository} from './voiceMail.repository.interface';
import {VoiceMail} from '../../../database/models/voiceMail.model';

export class VoiceMailRepository
  extends BaseRepository<IVoiceMail>
  implements IVoiceMailRepository
{
  constructor() {
    super(VoiceMail);
  }
}
