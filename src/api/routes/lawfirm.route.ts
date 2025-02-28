import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import lawfirmController from '../controllers/lawfirm/lawfirm.controller';
const router = Router();

router.post(
  '/create/lawfirm/:id',
  authorize.validateAuth,
  lawfirmController.createLawfirm
);

export default router;
