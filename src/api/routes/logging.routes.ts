import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import loggingController from '../controllers/logging/logging.controller';
loggingController;
const router = Router();

router.get(
  '/getLogsByTraceId/:id',
  authorize.validateAuth,
  loggingController.getLogsByTraceId
);

router.get(
  '/getLogsByTrackingId/:id',
  authorize.validateAuth,
  loggingController.getLogsByTrackingId
);

export default router;
