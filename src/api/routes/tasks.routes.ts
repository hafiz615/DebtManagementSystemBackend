import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import tasksController from '../controllers/tasks/tasks.controller';
import taskValidate from '../../middleware/validators/task.validate';
const router = Router();

router.get('/getTasks', authorize.validateAuth, tasksController.getTasks);

router.get('/getAllTasks', authorize.validateAuth, tasksController.getAllTasks);

router.post(
  '/addTask',
  authorize.validateAuth,
  taskValidate.addTask,
  tasksController.addTask
);

router.get(
  '/getTaskById/:id',
  authorize.validateAuth,
  tasksController.getTaskById
);

router.put(
  '/updateTask/:id',
  authorize.validateAuth,
  taskValidate.updateTask,
  tasksController.updateTask
);

router.delete(
  '/deleteTask/:id',
  authorize.validateAuth,
  tasksController.deleteTask
);

export default router;
