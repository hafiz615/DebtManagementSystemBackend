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
// router.post(
//   '/createVault/:id',
//   authorize.validateAuth,
//   debtorController.createVault
// );
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
router.post(
  '/createDebtor',
  authorize.validateAuth,
  debtor.createDebtor,
  debtorController.createDebtor
);
router.post(
  '/addDocumentsToDebtor/:id',
  authorize.validateAuth,
  debtorController.addDocumentsToDebtor
);
router.get(
  '/getLumpSumAmount/:id',
  authorize.validateAuth,
  debtorController.getLumpSumAmount
);

router.get(
  '/getFullProfitSettlement/:id',
  authorize.validateAuth,
  debtorController.getFullProfitSettlement
);

router.get(
  '/getLumpSumJustifications/:id',
  authorize.validateAuth,
  debtorController.getLumpSumJustifications
);

router.get(
  '/getFullProfitJustifications/:id',
  authorize.validateAuth,
  debtorController.getFullProfitJustifications
);
router.post(
  '/getExtractedFields/:id',
  authorize.validateAuth,
  debtorController.getExtractedFields
);

router.post(
  '/createMultipleDebtors',
  authorize.validateAuth,
  debtor.createMultipleDebtors,
  debtorController.createMultipleDebtors
);

router.put(
  '/updateDebtorBulk/:id',
  authorize.validateAuth,
  debtor.updateDebtorBulk,
  debtorController.updateDebtorBulk
);

export default router;
