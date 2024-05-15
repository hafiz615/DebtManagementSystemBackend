import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import creditorController from '../controllers/creditor/creditor.controller';

const router = Router();

router.post(
  '/getCreditor',
  authorize.validateAuth,
  creditorController.getCreditor
);

export default router;
