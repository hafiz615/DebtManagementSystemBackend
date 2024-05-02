import commonUtil from '../../utils/common.util';
export class User {
  name = '';
  email = '';
  password = '';
  role = '';
  jwtToken = '';
  verifyToken = '';
  isActive = false;
  createdBy = '';
  SSID = '';
  dateOfBirth = '';
  phone = '';
  gender = '';
  address = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
