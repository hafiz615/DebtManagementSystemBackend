import commonUtil from '../../utils/common.util';

export class Draft {
  userId = '';
  caseId = '';
  from = '';
  to = '';
  cc = null;
  subject = '';
  content = '';
  caseCode = '';
  debtorCompanyName = '';
  creditorCompanyName = '';
  negotiatorName = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
