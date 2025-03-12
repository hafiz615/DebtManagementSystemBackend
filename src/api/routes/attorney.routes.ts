import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import attorneyValidate from '../../middleware/validators/attorney.validate';
import attorneyController from '../controllers/attorney/attorney.controller';
const router = Router();
router.get(
  '/getLawsuitDetails/:id',
  authorize.validateAuth,
  attorneyController.getLawsuitDetails
);

router.post(
  '/cancelLawSuitPaymentPlan/:id',
  authorize.validateAuth,
  attorneyValidate.validateCaseId,
  attorneyController.cancelLawSuitPaymentPlan
);

export default router;
