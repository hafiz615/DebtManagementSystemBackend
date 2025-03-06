import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import seemlesschexController from '../controllers/seemlesschex/seemlesschex.controller';
import seemlesschexValidate from '../../middleware/validators/seemlesschex.validate';
import paymentValidate from '../../middleware/validators/payment.validate';
import paymentController from '../controllers/payment/payment.controller';

const router = Router();

router.post(
  '/createCheck',
  authorize.validateAuth,
  seemlesschexValidate.createCheck,
  seemlesschexController.createCheck
);

router.post(
  '/createPaymentLink',
  seemlesschexValidate.createPaymentLink,
  seemlesschexController.createPaymentLink
);

router.post(
  '/updateCheck/:id',
  authorize.validateAuth,
  seemlesschexValidate.updateCheck,
  seemlesschexController.updateCheck
);

router.delete(
  '/voidCheck/:id',
  authorize.validateAuth,
  seemlesschexValidate.voidCheck,
  seemlesschexController.voidCheck
);

router.get(
  '/getClientChecks/:id',
  authorize.validateAuth,
  seemlesschexController.getClientChecks
);

router.post(
  '/update-payment-link-status/:token',
  paymentValidate.updatePaymentLinkStatus,
  paymentController.updatePaymentLinkStatus
);

router.post(
  '/update-invoice-status/:token',
  paymentValidate.updatePaymentInvoiceStatus,
  paymentController.updatePaymentInvoiceStatus
);

router.get('/get-invoice-status/:token', paymentController.getInvoiceStatus);
router.get(
  '/get-payment-link-status/:token',
  paymentController.getPaymentLinkStatus
);

router.post('/statusChanged', seemlesschexController.statusChanged);
export default router;
