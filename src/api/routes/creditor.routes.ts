import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import creditorController from '../controllers/creditor/creditor.controller';
import creditorValidate from '../../middleware/validators/creditor.validate';

const router = Router();

router.post(
  '/getCreditor',
  authorize.validateAuth,
  creditorController.getCreditor
);
router.put(
  '/updateCreditor/:id',
  authorize.validateAuth,
  creditorValidate.validateCreditor,
  creditorController.updateCreditor
);
router.post(
  '/listing/details/:id',
  authorize.validateAuth,
  creditorController.listingDetails
);
router.post('/listing', authorize.validateAuth, creditorController.listing);

router.post(
  '/updateCreditorAccountTitle/:id',
  authorize.validateAuth,
  creditorController.updateCreditorAccountTitle
);

router.put(
  '/updateMultipleCreditors/:id',
  creditorValidate.validateMultipleCreditors,
  authorize.validateAuth,
  creditorController.updateMultipleCreditors
);

router.post(
  '/createPaynoteCustomer/:id',
  authorize.validateAuth,
  creditorController.createPaynoteCustomer
);

router.post(
  '/pausePayments/:id',
  authorize.validateAuth,
  creditorController.pausePayments
);

router.post(
  '/syncPaynote/:id',
  authorize.validateAuth,
  creditorValidate.syncEmail,
  creditorController.syncPaynote
);

router.get(
  '/getSyncEmail/:id',
  authorize.validateAuth,
  creditorController.getSyncEmail
);

router.get(
  '/mcaByMonth/:id',
  authorize.validateAuth,
  creditorController.mcaByMonth
);

export default router;
