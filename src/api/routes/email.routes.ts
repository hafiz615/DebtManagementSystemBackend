import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import caseValidate from '../../middleware/validators/case.validate';
import emailController from '../controllers/email/email.controller';

const router = Router();

router.post(
  '/sendSmsEmailDebtorCreditor/:id',
  authorize.validateAuth,
  caseValidate.sendSmsEmailDebtorCreditor,
  emailController.sendSmsEmailDebtorCreditor
); // not in current use

router.post('/sendGridParseEmail', emailController.sendGridEmail);
export default router;
