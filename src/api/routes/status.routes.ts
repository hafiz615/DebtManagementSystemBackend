import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import statusController from '../controllers/status/status.controller';
import statusValidate from '../../middleware/validators/status.validate';

const router = Router();

router.get(
  '/getCaseStatuses',
  authorize.validateAuth,
  statusController.getCaseStatuses
);

router.post(
  '/addStatus',
  authorize.validateAuth,
  statusValidate.addStatus,
  statusController.addStatus
);

router.get(
  '/getStatusesById/:id',
  authorize.validateAuth,
  statusController.getStatusesById
);

router.post(
  '/updateStatus/:id',
  authorize.validateAuth,
  statusValidate.updateStatus,
  statusController.updateStatus
);

router.post(
  '/updateStatusArray/:id',
  authorize.validateAuth,
  statusValidate.updateStatusArray,
  statusController.updateStatusArray
);

router.post(
  '/deleteStatus/:id',
  authorize.validateAuth,
  statusValidate.deleteStatus,
  statusController.deleteStatus
);

export default router;
