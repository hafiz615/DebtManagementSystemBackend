import {Document} from 'mongoose';

export interface ITasks extends Document {
  target: string;
  dueDate: string;
  caseId: string;
  assignee: string;
  assigneeId: string;
  title: string;
  status: string;
  notes: string;
  isDeleted: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
