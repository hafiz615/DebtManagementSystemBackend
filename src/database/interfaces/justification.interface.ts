import {Document} from 'mongoose';

export interface IJustification extends Document {
  gemini: boolean;
  llama: boolean;
  chatgpt: boolean;
  claude: boolean;
  createdAt: string;
  updatedAt: string;
}
