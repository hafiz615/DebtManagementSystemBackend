import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import debtorController from '../controllers/debtor/debtor.controller';

const router = Router();

router.get('/getDebtor', authorize.validateAuth, debtorController.getDebtor);

export default router;
