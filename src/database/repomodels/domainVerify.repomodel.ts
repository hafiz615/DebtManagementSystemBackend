import commonUtil from '../../utils/common.util';

export class DomainVerify {
  link = '';
  isVerified = false;
  from = '';
  subject = '';
  text = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
