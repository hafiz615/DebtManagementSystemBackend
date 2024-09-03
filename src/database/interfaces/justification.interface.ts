import {Document} from 'mongoose';

export interface IJustification extends Document {
  gemini: boolean;
  llama: boolean;
  chatGpt: boolean;
  createdAt: string;
  updatedAt: string;
}
