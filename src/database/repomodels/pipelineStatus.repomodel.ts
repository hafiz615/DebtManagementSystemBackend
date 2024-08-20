import commonUtil from '../../utils/common.util';

export class PipelineStatus {
  pipeline = '';
  status = Array<{name: ''; type: ''}>();
  description = '';
  userId = '';
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
