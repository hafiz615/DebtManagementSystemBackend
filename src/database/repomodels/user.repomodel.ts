import commonUtil from '../../utils/common.util';
export class User {
  name = '';
  email = '';
  password = '';
  role = '';
  verifyToken = '';
  isActive = false;
  createdBy = '';
  SSID = '';
  dateOfBirth = '';
  phone = '';
  gender = '';
  address = '';
  isDeleted = false;
  sessionIds = Array<string>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
