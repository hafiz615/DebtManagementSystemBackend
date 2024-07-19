import {IRolesPermissions} from '../../../database/interfaces/rolesPermissions.interface';
import {IBaseRepository} from '../base.repository.interface';

export interface IRolesPermissionRepository
  extends IBaseRepository<IRolesPermissions> {}
