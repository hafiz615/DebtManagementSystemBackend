import commonUtil from '../../utils/common.util';

export class Check {
  checkId = '';
  debtorId = '';
  number = '';
  status = '';
  basicVerification = '';
  fundsConfirmation = '';
  bvReason = '';
  fcReason = '';
  isDeleted = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
