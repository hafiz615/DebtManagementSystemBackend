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
  twilioNo: '';
  telnyxNo: '';
  gender = '';
  address = '';
  isDeleted = false;
  sessionIds = Array<string>();
  platform = '';
  isPlatform = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
