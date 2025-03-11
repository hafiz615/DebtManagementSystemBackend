import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import attorneyValidate from '../../middleware/validators/attorney.validate';
import attorneyController from '../controllers/attorney/attorney.controller';
const router = Router();
router.post(
  '/getLawSuitBalanceSummary/:id',
  authorize.validateAuth,
  attorneyValidate.getLawSuitBalanceSummary,
  attorneyController.getLawSuitBalanceSummary
);

export default router;
