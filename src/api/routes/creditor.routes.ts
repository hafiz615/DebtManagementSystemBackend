import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import creditorController from '../controllers/creditor/creditor.controller';
import creditor from '../../middleware/validators/creditor.middleware';

const router = Router();

router.post(
  '/getCreditor',
  authorize.validateAuth,
  creditorController.getCreditor
);
router.put(
  '/updateCreditor/:id',
  authorize.validateAuth,
  creditor.validateCreditor,
  creditorController.updateCreditor
);
router.post(
  '/listing/details/:id',
  authorize.validateAuth,
  creditorController.listingDetails
);
router.post('/listing', authorize.validateAuth, creditorController.listing);

export default router;
