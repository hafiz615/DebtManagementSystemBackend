import commonUtil from '../../utils/common.util';

export class BulkUpload {
  debtor = null;
  status = 'Pending';
  retries = 0;
  driveUrl = '';
  errorMessage = '';
  createdByName = '';
  createdById = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
