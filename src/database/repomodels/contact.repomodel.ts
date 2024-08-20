import commonUtil from '../../utils/common.util';

export class Contact {
  name = '';
  title = '';
  phone = '';
  email = '';
  relationWithDebtor = '';
  country = '';
  state = '';
  city = '';
  zipCode = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
