import mongoose, {Schema} from 'mongoose';
import {ITasks} from '../interfaces/tasks.interface';

const tasksModel = new Schema({
  target: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  caseId: {
    type: String,
  },
  assignee: {
    type: String,
  },
  assigneeId: {
    type: String,
  },
  title: {
    type: String,
  },
  status: {
    type: String,
  },
  notes: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
});

export const Tasks = mongoose.model<ITasks>('Tasks', tasksModel);
