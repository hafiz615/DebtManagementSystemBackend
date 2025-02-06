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
  type = 'draft';
  medium: '';
  isDeleted = false;
  debtorCompanyName = '';
  creditorCompanyName = '';
  negotiatorName = '';
  threadId = '';
  previousMessages: string[] = [];
  attachments = Array<{key: ''; originalFileName: ''; url: ''}>();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
