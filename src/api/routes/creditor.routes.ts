import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import creditorController from '../controllers/creditor/creditor.controller';
import creditor from '../../middleware/creditor.middleware';

const router = Router();

router.post(
  '/getCreditor',
  authorize.validateAuth,
  creditorController.getCreditor
);
router.put(
  '/updateCreditor',
  authorize.validateAuth,
  creditor.validateCreditor,
  creditorController.updateCreditor
);

export default router;
