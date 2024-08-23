import commonUtil from '../../utils/common.util';
export class User {
  caseId = '';
  caseHistory = Array<any>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
