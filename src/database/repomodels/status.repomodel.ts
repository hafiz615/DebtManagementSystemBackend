import commonUtil from '../../utils/common.util';

export class Status {
  status = Array<string>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
