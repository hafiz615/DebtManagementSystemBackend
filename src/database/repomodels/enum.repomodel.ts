import commonUtil from '../../utils/common.util';

export class Enum {
  enumTarget = '';
  enumList = Array<string>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
