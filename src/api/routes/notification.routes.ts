import {Router} from 'express';
import notificationController from '../controllers/notification/notification.controller';
import authorize from '../../middleware/authorize.middleware';

const router = Router();

router.post(
  '/getAllNotifications',
  authorize.validateAuth,
  notificationController.getAllNotifications
);

router.put(
  '/markAsRead/:id',
  authorize.validateAuth,
  notificationController.markAsRead
);

export default router;
