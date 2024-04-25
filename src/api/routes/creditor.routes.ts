import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import creditorController from '../controllers/creditor/creditor.controller';

const router = Router();

router.get(
  '/getCreditor',
  authorize.validateAuth,
  creditorController.getCreditor
);

export default router;
