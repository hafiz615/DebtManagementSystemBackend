import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import debtorController from '../controllers/debtor/debtor.controller';

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

export default router;
