import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import paymentController from '../controllers/payment/payment.controller';

const router = Router();

router.post(
  '/getHomePayments',
  authorize.validateAuth,
  paymentController.getHomePayments
);

router.get(
  '/getCasePayments/:id',
  authorize.validateAuth,
  paymentController.getCasePayments
);

export default router;
