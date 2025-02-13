import commonUtil from '../../utils/common.util';

export class Tasks {
  dueDate = '';
  caseId = '';
  assignee = '';
  assigneeId = '';
  title = '';
  status = 'To do';
  notes = '';
  isDeleted = false;
  isCompleted = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
