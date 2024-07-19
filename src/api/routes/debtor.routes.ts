import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import debtorController from '../controllers/debtor/debtor.controller';
import debtor from '../../middleware/validators/debtor.validate';

const router = Router();

router.post('/getDebtor', authorize.validateAuth, debtorController.getDebtor);
router.post(
  '/listing/details/:id',
  authorize.validateAuth,
  debtorController.listingDetails
);
router.post(
  '/listing/search',
  authorize.validateAuth,
  debtorController.searchListing
);
router.put(
  '/updateDebtor/:id',
  authorize.validateAuth,
  debtor.validateDebtor,
  debtorController.updateDebtor
);
router.post(
  '/createVault/:id',
  authorize.validateAuth,
  debtorController.createVault
);
router.get(
  '/retryAuth/:id',
  authorize.validateAuth,
  debtorController.retryAuth
);
router.get(
  '/retryCapture/:id',
  authorize.validateAuth,
  debtorController.retryCapture
);
router.get(
  '/getAllDebtors',
  authorize.validateAuth,
  debtorController.getAllDebtors
);
export default router;
