import commonUtil from '../../utils/common.util';

export class Lawfirm {
  userId = null;
  lawfirmCompanyName = '';
  email = '';
  phone = '';
  address = '';
  city = '';
  state = '';
  status = '';
  EIN = '';
  isDeleted = false;
  lawfirmFee = 0;
  platform = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
