import commonUtil from '../../utils/common.util';
export class CaseHistory {
  caseId = '';
  caseHistory = Array<any>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
