import commonUtil from '../../utils/common.util';

export class SyncCreditor {
  creditorId = '';
  email = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
