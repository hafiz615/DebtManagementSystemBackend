import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import paymentController from '../controllers/payment/payment.controller';
import paymentValidate from '../../middleware/validators/payment.validate';

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

router.post(
  '/addACHDetailsCreditor/:id',
  authorize.validateAuth,
  paymentValidate.addACHDetailsCreditor,
  paymentController.addACHDetailsCreditor
);

router.get(
  '/processAuthAndCapture',
  authorize.validateAuth,
  paymentController.processAuthAndCapture
);

router.get(
  '/processPaynoteTransfer',
  authorize.validateAuth,
  paymentController.processPaynoteTransfer
);
export default router;
