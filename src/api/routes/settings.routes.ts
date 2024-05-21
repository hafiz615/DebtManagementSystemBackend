import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import settingsController from '../controllers/setting/settings.controller';

const router = Router();

router.post(
  '/addSettings',
  authorize.validateAuth,
  settingsController.addSettings
);
router.post(
  '/addCustomFields',
  authorize.validateAuth,
  settingsController.addCustomFields
);
router.post(
  '/editCustomFields',
  authorize.validateAuth,
  settingsController.editCustomFields
);
router.post(
  '/getCustomFields',
  authorize.validateAuth,
  settingsController.getCustomFields
);
router.post(
  '/deleteCustomField',
  authorize.validateAuth,
  settingsController.deleteCustomField
);

export default router;
