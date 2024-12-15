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

router.get(
  '/getAllUpcomingPayments/:id',
  authorize.validateAuth,
  paymentController.getAllUpcomingPayments
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

router.get(
  '/firstChoiceCommission',
  authorize.validateAuth,
  paymentController.firstChoiceCommission
);

router.get(
  '/sendPaymentPaynote/:id',
  authorize.validateAuth,
  paymentController.sendPaymentPaynote
);

router.get(
  '/cancelCasePaymentPlan/:id',
  authorize.validateAuth,
  paymentController.cancelCasePaymentPlan
);

router.get(
  '/cancelDebtorPaymentPlan/:id',
  authorize.validateAuth,
  paymentController.cancelDebtorPaymentPlan
);

router.get(
  '/getCommissionPayments',
  authorize.validateAuth,
  paymentController.getCommissionPayments
);
export default router;
