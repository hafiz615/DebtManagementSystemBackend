import commonUtil from '../../utils/common.util';

export class CustomFiled {
  name = '';
  type = '';
  target = '';
  description = '';
  shared = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}

export class TargetCustomFields {
  target = '';
  customFields = Array<{name: ''; value: any}>();
  caseId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
