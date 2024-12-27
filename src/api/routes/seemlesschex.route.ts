import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import seemlesschexController from '../controllers/seemlesschex/seemlesschex.controller';
import seemlesschexValidate from '../../middleware/validators/seemlesschex.validate';

const router = Router();

router.post(
  '/createCheck',
  authorize.validateAuth,
  seemlesschexValidate.createCheck,
  seemlesschexController.createCheck
);

router.post(
  '/createPaymentLink',
  seemlesschexValidate.createPaymentLink,
  seemlesschexController.createPaymentLink
);
export default router;
