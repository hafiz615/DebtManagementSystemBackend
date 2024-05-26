import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import settingsController from '../controllers/setting/settings.controller';
import customFieldValidate from '../../middleware/validators/customField.validate';

const router = Router();

router.patch(
  '/addSettings',
  authorize.validateAuth,
  settingsController.addSettings
);

router.get(
  '/getSettings',
  authorize.validateAuth,
  settingsController.getSettings
);

router.post(
  '/addCustomField',
  authorize.validateAuth,
  customFieldValidate.addCustomField,
  settingsController.addCustomField
);
router.put(
  '/editCustomField/:id',
  authorize.validateAuth,
  settingsController.editCustomField
);
router.get(
  '/getCustomFieldsByTarget',
  authorize.validateAuth,
  settingsController.getCustomFieldsByTarget
);
router.post(
  '/addCustomFieldByTarget',
  authorize.validateAuth,
  settingsController.addCustomFieldByTarget
);
router.delete(
  '/removeCustomFieldByTarget',
  authorize.validateAuth,
  settingsController.removeCustomFieldByTarget
);
router.delete(
  '/deleteCustomField/:id',
  authorize.validateAuth,
  settingsController.deleteCustomField
);

export default router;
