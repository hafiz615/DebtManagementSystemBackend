import {ISignature} from '../../../database/interfaces/signature.interface';
import {Signature} from '../../../database/models/signature.model';
import {BaseRepository} from '../base.repository';
import {ISignatureRepository} from './signature.repository.interface';

export class SignatureRepository
  extends BaseRepository<ISignature>
  implements ISignatureRepository
{
  constructor() {
    super(Signature);
  }
}
