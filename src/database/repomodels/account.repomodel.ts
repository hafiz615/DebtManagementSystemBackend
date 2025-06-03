import commonUtil from '../../utils/common.util';

export class Account {
  debtorId = null;
  paymentType = '';
  platform = '';
  vault = '';
  priority = 0;
  paynoteSourceId = '';
  logTrackingId = '';
  isDeleted = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
