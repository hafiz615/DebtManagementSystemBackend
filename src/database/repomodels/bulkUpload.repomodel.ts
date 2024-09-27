import commonUtil from '../../utils/common.util';

export class BulkUpload {
  debtor = null;
  status = 'Pending';
  retries = 0;
  driveUrl = '';
  errorMessage = '';
  createdByName = '';
  createdById = '';
  caseIds = Array<string>();
  time = Array<string>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
