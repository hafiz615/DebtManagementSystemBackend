import commonUtil from '../../utils/common.util';

export class syncPaymentMethod {
  syncId = '';
  email = '';
  platform = '';
  customerVaultId='';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
