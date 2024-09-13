import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import settingsController from '../controllers/setting/settings.controller';
import customFieldValidate from '../../middleware/validators/customField.validate';
import settingValidate from '../../middleware/validators/setting.validation';
const router = Router();

router.post(
  '/addSettings',
  authorize.validateAuth,
  settingValidate.paymentsAuthorizations,
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
router.put(
  '/updateCustomFieldByTarget',
  authorize.validateAuth,
  settingsController.updateCustomFieldByTarget
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

router.put(
  '/editNotificationTemplate',
  authorize.validateAuth,
  settingsController.editNotificationTemplate
);

router.post(
  '/deleteNotificationTemplate',
  authorize.validateAuth,
  settingsController.deleteNotificationTemplate
);
router.post(
  '/addNotificationConfiguration',
  authorize.validateAuth,
  settingValidate.validateNotificationConfiguration,
  settingsController.notificationConfiguration
);

router.get(
  '/getNotificationConfiguration',
  authorize.validateAuth,
  settingsController.getNotificationConfiguration
);

router.get(
  '/getSystemTemplate',
  authorize.validateAuth,
  settingsController.getSystemTemplate
);

router.get(
  '/getCustomFields',
  authorize.validateAuth,
  settingsController.getCustomFields
);

export default router;
