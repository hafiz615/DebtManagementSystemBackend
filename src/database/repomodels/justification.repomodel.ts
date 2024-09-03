import commonUtil from '../../utils/common.util';

export class Justification {
  gemini = false;
  llama = false;
  chatGpt = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
