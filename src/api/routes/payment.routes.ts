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

router.post(
  '/getCreditorSuccessfulPayments',
  authorize.validateAuth,
  paymentController.getCreditorSuccessfulPayments
);

router.post(
  '/creditorUpcomingPayments',
  authorize.validateAuth,
  paymentController.getCreditorUpcomingPayments
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
  '/addACHDetails/:id',
  authorize.validateAuth,
  paymentValidate.addACHDetails,
  paymentController.addACHDetails
);

router.post(
  '/addAccount/:id',
  paymentValidate.addAccount,
  paymentController.addAccount
);

router.put(
  '/updateACHDetails/:id',
  authorize.validateAuth,
  paymentValidate.updateACHDetails,
  paymentController.updateACHDetails
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
  '/cancelAllDebtorPaymentPlan/:id',
  authorize.validateAuth,
  paymentController.cancelAllDebtorPaymentPlan
);

router.get(
  '/getCommissionPayments',
  authorize.validateAuth,
  paymentController.getCommissionPayments
);

router.get(
  '/getRelatedPayments/:id',
  authorize.validateAuth,
  paymentController.getRelatedPayments
);

router.post(
  '/addAttorneyPaymentPlan/:id',
  authorize.validateAuth,
  paymentController.addPaymentPlan
);

router.post(
  '/updatePaymentDate/:id',
  authorize.validateAuth,
  paymentValidate.updatePaymentDate,
  paymentController.updatePaymentDate
);

router.post('/checkInvoice', paymentController.checkInvoice);

router.get(
  '/getInstantPayment/:id',
  authorize.validateAuth,
  paymentController.getInstantPayment
);

router.get(
  '/getCaseAttorneyPayments/:id',
  authorize.validateAuth,
  paymentController.getCaseAttorneyPayments
);

router.post('/paynote-webhook', paymentController.paynoteWebhook);

router.post(
  '/getClientPendingChecks',
  authorize.validateAuth,
  paymentController.getClientPendingChecks
);

router.get(
  '/cronSeamlesschex',
  authorize.validateAuth,
  paymentController.cronSeamlesschex
);

router.post(
  '/deletePayment/:id',
  authorize.validateAuth,
  paymentController.deletePayment
);

export default router;
