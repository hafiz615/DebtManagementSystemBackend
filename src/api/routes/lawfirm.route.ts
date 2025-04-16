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

router.get(
  '/getLawfirms',
  authorize.validateAuth,
  lawfirmController.getLawfirm
);

router.post(
  '/assignLawfirmToCase/:id',
  authorize.validateAuth,
  lawfirmValidate.assignLawfirmToCase,
  lawfirmController.assignLawfirmToCase
);

router.post(
  '/updateLawsuit/:id',
  authorize.validateAuth,
  lawfirmValidate.updateLawsuit,
  lawfirmController.updateLawsuit
);

router.post(
  '/addAttorney/:id',
  authorize.validateAuth,
  lawfirmValidate.addAttorney,
  lawfirmController.addAttorney
);

export default router;
