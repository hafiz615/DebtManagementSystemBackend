import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import lawfirmController from '../controllers/lawfirm/lawfirm.controller';
import lawfirmValidate from '../../middleware/validators/lawfirm.validate';
const router = Router();

router.post(
  '/create/lawfirm/:id',
  authorize.validateAuth,
  lawfirmController.createLawfirm
);

router.put(
  '/updateLawfirm/:id',
  authorize.validateAuth,
  lawfirmValidate.updateLawfirm,
  lawfirmController.updateLawfirm
);

export default router;
