import commonUtil from '../../utils/common.util';

export class Inbox {
  from = '';
  to = '';
  cC = '';
  subject = '';
  name = '';
  text = '';
  textAsHtml = '';
  caseCode = '';
  isRead = false;
  type = '';
  debitorCompanyName = '';
  creditorCompanyName = '';
  negotiatorName = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
