import commonUtil from '../../utils/common.util';

export class Inbox {
  from = '';
  to = '';
  cc = null;
  subject = '';
  text = '';
  textAsHtml = '';
  caseCode = '';
  isRead = false;
  type = '';
  debtorCompanyName = '';
  creditorCompanyName = '';
  negotiatorName = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
