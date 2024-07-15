import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import rolesPermissionsController from '../controllers/rolesPermissions/rolesPermissions.controller';
import rolesPermissionsValidate from '../../middleware/validators/rolesPermissions.validate';

const router = Router();

router.post(
  '/createRole',
  authorize.validateAuth,
  rolesPermissionsValidate.role,
  rolesPermissionsController.createRole
);

router.get(
  '/getAllRoles',
  authorize.validateAuth,
  rolesPermissionsController.getAllRoles
);

router.get(
  '/getRoleById/:id',
  authorize.validateAuth,
  rolesPermissionsController.getRoleById
);

router.get(
  '/getRoleByName',
  authorize.validateAuth,
  rolesPermissionsController.getRoleByName
);

router.post(
  '/updateRole/:id',
  authorize.validateAuth,
  rolesPermissionsValidate.role,
  rolesPermissionsController.updateRole
);

router.delete(
  '/deleteRole/:id',
  authorize.validateAuth,
  rolesPermissionsController.deleteRole
);

export default router;
