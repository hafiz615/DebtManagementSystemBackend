import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import debtorController from '../controllers/debtor/debtor.controller';

const router = Router();

router.get('/getDebtor', authorize.validateAuth, debtorController.getDebtor);
router.get('/listing', authorize.validateAuth, debtorController.listing);

export default router;
