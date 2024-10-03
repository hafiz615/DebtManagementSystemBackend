import commonUtil from '../../utils/common.util';

export class DomainVerify {
  link = '';
  isVerified = false;
  from = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
