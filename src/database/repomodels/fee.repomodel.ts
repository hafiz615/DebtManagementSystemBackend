import commonUtil from '../../utils/common.util';

export class Fee {
  fee = 0;
  type = '';
  userId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
