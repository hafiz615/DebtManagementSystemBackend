import {IBulkUpload} from '../../../database/interfaces/bulkUpload.interface';
import {BulkUpload} from '../../../database/models/bulkUpload.model';
import {BaseRepository} from '../base.repository';
import {IBulkUploadRepository} from './bulkUpload.repository.interface';
export class BulkUploadRepository
  extends BaseRepository<IBulkUpload>
  implements IBulkUploadRepository
{
  constructor() {
    super(BulkUpload);
  }
}
