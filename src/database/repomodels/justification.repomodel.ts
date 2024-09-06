import commonUtil from '../../utils/common.util';

export class Justification {
  gemini = false;
  llama = false;
  chatgpt = false;
  claude = false;
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
