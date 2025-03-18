import commonUtil from '../../utils/common.util';

export class Signature {
  signature = '';
  userId = null;
  isDeleted = false;
  active = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
