import commonUtil from '../../utils/common.util';
// import {v4} from 'uuid';

export class Inbox {
  from = '';
  to = '';
  cc = null;
  subject = '';
  text = '';
  textAsHtml = '';
  caseCode = '';
  caseId = '';
  userId = '';
  userName = '';
  isRead = false;
  type = '';
  debtorCompanyName = '';
  creditorCompanyName = '';
  negotiatorName = '';
  threadId = '';
  attachments = Array<{key: ''; originalFileName: ''; url: ''}>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
