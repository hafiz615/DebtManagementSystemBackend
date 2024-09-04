import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import caseValidate from '../../middleware/validators/case.validate';
import emailController from '../controllers/email/email.controller';

const router = Router();

router.post(
  '/sendSmsEmailDebtorCreditor/:id',
  authorize.validateAuth,
  caseValidate.sendEmail,
  emailController.sendSmsEmailDebtorCreditor
); // not in current use
export default router;
