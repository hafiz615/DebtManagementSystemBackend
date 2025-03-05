import commonUtil from '../../utils/common.util';

export class Attorney {
  lawfirmId = null;
  userId = null;
  name = '';
  email = '';
  phone = '';
  address = '';
  city = '';
  SSN = '';
  state = '';
  status = '';
  isDeleted = false;
  attorneyFee = 0;
  platform = false;
  paynoteUserId = '';
  paynoteSourceId = '';
  paynoteSourceVerified = false;
  paynoteUserFound = false;
  logTrackingId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
