import {Router} from 'express';
import inboxValidate from '../../middleware/validators/inbox.validate';
import inboxController from '../controllers/inbox/inbox.controller';
import authorize from '../../middleware/authorize.middleware';

const router = Router();

router.post(
  '/getAllMessages',
  authorize.validateAuth,
  inboxController.getAllMessages
);

router.put(
  '/markAsRead/:id',
  authorize.validateAuth,
  inboxController.markAsRead
);

export default router;
