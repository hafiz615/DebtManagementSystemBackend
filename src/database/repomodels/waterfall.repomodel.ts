import commonUtil from '../../utils/common.util';

export class Waterfall {
  debtorId = null;
  paymentId = null;
  execute = false;
  logTrackingId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
