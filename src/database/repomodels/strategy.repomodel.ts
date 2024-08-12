import commonUtil from '../../utils/common.util';

export class Status {
  caseId = '';
  name = '';
  data = null;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
