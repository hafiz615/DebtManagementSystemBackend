import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import debtorController from '../controllers/debtor/debtor.controller';
import debtor from '../../middleware/validators/debtor.middleware';

const router = Router();

router.post('/getDebtor', authorize.validateAuth, debtorController.getDebtor);
router.get(
  '/listing/details/:id',
  authorize.validateAuth,
  debtorController.listingDetails
);
router.get(
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
export default router;
